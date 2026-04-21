import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  listDueAlerts,
  recordAlertCheck,
  type AlertOperator,
  type DashboardAlert,
} from "@/lib/supabase/alerts";
import { computeMetric } from "@/lib/dashlink/aggregation";
import type { DashWidget, KpiWidget } from "@/lib/dashlink/builder-types";
import type { AuthConfig, Dataset } from "@/lib/dashlink/types";
import { flattenJsonToDataset } from "@/lib/dashlink/flatten";

export const dynamic = "force-dynamic";

// Authentication: require either CRON_SECRET header match, or Vercel Cron's
// own request header (when configured via vercel.json).
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In dev allow anonymous so it's testable without env.
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron sends this header when triggered by the platform.
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

function compare(
  operator: AlertOperator,
  current: number,
  threshold: number,
  previous: number | null,
): boolean {
  switch (operator) {
    case "gt":
      return current > threshold;
    case "lt":
      return current < threshold;
    case "gte":
      return current >= threshold;
    case "lte":
      return current <= threshold;
    case "eq":
      return current === threshold;
    case "change_pct": {
      if (previous === null || previous === 0) return false;
      const pct = ((current - previous) / Math.abs(previous)) * 100;
      return Math.abs(pct) >= Math.abs(threshold);
    }
  }
}

function operatorLabel(op: AlertOperator): string {
  switch (op) {
    case "gt":
      return ">";
    case "lt":
      return "<";
    case "gte":
      return ">=";
    case "lte":
      return "<=";
    case "eq":
      return "=";
    case "change_pct":
      return "% change >=";
  }
}

async function fetchProjectData(
  apiUrl: string,
  authConfig: AuthConfig,
): Promise<Dataset> {
  if (!apiUrl || !apiUrl.startsWith("http")) return [];

  const headers: Record<string, string> = { Accept: "application/json" };
  if (authConfig.type === "bearer" && authConfig.token) {
    headers["Authorization"] = `Bearer ${authConfig.token}`;
  } else if (authConfig.type === "apikey" && authConfig.token) {
    headers[authConfig.headerName?.trim() || "X-API-Key"] = authConfig.token;
  } else if (
    authConfig.type === "basic" &&
    authConfig.username &&
    authConfig.password
  ) {
    headers["Authorization"] =
      "Basic " +
      Buffer.from(`${authConfig.username}:${authConfig.password}`).toString(
        "base64",
      );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(apiUrl, { headers, signal: controller.signal });
    if (!res.ok) return [];
    const json = await res.json();
    return flattenJsonToDataset(json).slice(0, 5000);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function notify(
  alert: DashboardAlert,
  payload: {
    value: number;
    threshold: number;
    operator: AlertOperator;
    projectId: string;
    widget: KpiWidget;
  },
): Promise<string | null> {
  const body = {
    alertId: alert.id,
    projectId: payload.projectId,
    widgetId: alert.widgetId,
    label: alert.label,
    field: payload.widget.field,
    metric: payload.widget.metric ?? "sum",
    operator: payload.operator,
    operatorLabel: operatorLabel(payload.operator),
    threshold: payload.threshold,
    value: payload.value,
    triggeredAt: new Date().toISOString(),
  };

  if (alert.webhookUrl) {
    try {
      const res = await fetch(alert.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return `webhook ${res.status}`;
      }
    } catch (err) {
      return err instanceof Error ? err.message : "webhook failed";
    }
  }

  // Email delivery — only attempted if RESEND_API_KEY is configured.
  if (alert.email && process.env.RESEND_API_KEY) {
    try {
      const subject = `[DashLink] ${alert.label}: ${payload.value}`;
      const html = `
        <h2>${alert.label}</h2>
        <p><strong>${payload.widget.field}</strong> (${payload.widget.metric ?? "sum"})
        is now <strong>${payload.value}</strong>
        ${operatorLabel(payload.operator)} ${payload.threshold}.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/projects/${payload.projectId}">Open dashboard →</a></p>
      `;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.RESEND_FROM_EMAIL ?? "DashLink <alerts@dashlink.app>",
          to: alert.email,
          subject,
          html,
        }),
      });
    } catch (err) {
      return err instanceof Error ? err.message : "email failed";
    }
  }

  return null;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  let alerts: DashboardAlert[];
  try {
    alerts = await listDueAlerts(admin);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }

  // Group by project so we re-fetch a project's data only once.
  const byProject = new Map<string, DashboardAlert[]>();
  for (const a of alerts) {
    const list = byProject.get(a.projectId) ?? [];
    list.push(a);
    byProject.set(a.projectId, list);
  }

  const results: Array<{
    alertId: string;
    triggered: boolean;
    value?: number;
    error?: string;
  }> = [];

  for (const [projectId, group] of byProject) {
    const { data: project } = await admin
      .from("projects")
      .select("api_url, auth_config, widgets")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {
      for (const a of group) {
        await recordAlertCheck(admin, a.id, {
          lastError: "Project not found",
        });
        results.push({
          alertId: a.id,
          triggered: false,
          error: "project missing",
        });
      }
      continue;
    }

    const widgets = (
      Array.isArray(project.widgets) ? project.widgets : []
    ) as DashWidget[];

    // Try refetching live data first; fall back to stored snapshot.
    let dataset = await fetchProjectData(
      project.api_url ?? "",
      (project.auth_config ?? { type: "none" }) as AuthConfig,
    );

    if (dataset.length === 0) {
      const { data: snap } = await admin
        .from("project_snapshots")
        .select("data")
        .eq("project_id", projectId)
        .maybeSingle();
      dataset = (snap?.data ?? []) as Dataset;
    }

    for (const alert of group) {
      const widget = widgets.find(
        (w) => w.id === alert.widgetId && w.type === "kpi",
      ) as KpiWidget | undefined;

      if (!widget) {
        await recordAlertCheck(admin, alert.id, {
          lastError: "Widget not found",
        });
        results.push({
          alertId: alert.id,
          triggered: false,
          error: "widget missing",
        });
        continue;
      }

      const value = computeMetric(dataset, widget.field, widget.metric);
      const triggered = compare(
        alert.operator,
        value,
        alert.threshold,
        alert.lastValue,
      );

      let notifyError: string | null = null;
      let triggeredAt: string | null = null;

      if (triggered) {
        triggeredAt = new Date().toISOString();
        notifyError = await notify(alert, {
          value,
          threshold: alert.threshold,
          operator: alert.operator,
          projectId,
          widget,
        });
      }

      await recordAlertCheck(admin, alert.id, {
        lastValue: value,
        lastTriggeredAt: triggered ? triggeredAt : alert.lastTriggeredAt,
        lastError: notifyError,
      });

      results.push({
        alertId: alert.id,
        triggered,
        value,
        ...(notifyError ? { error: notifyError } : {}),
      });
    }
  }

  return NextResponse.json({
    checked: alerts.length,
    results,
    at: new Date().toISOString(),
  });
}

// Allow POST too so platforms that prefer POST work.
export const POST = GET;
