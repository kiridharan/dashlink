import type { SupabaseClient } from "@supabase/supabase-js";

export type AlertOperator = "gt" | "lt" | "gte" | "lte" | "eq" | "change_pct";

export interface DashboardAlert {
  id: string;
  projectId: string;
  widgetId: string;
  label: string;
  operator: AlertOperator;
  threshold: number;
  frequencyMinutes: number;
  webhookUrl: string | null;
  email: string | null;
  lastValue: number | null;
  lastTriggeredAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertInput {
  widgetId: string;
  label: string;
  operator: AlertOperator;
  threshold: number;
  frequencyMinutes: number;
  webhookUrl?: string | null;
  email?: string | null;
  enabled?: boolean;
}

interface AlertRow {
  id: string;
  project_id: string;
  widget_id: string;
  label: string;
  operator: string;
  threshold: number | string;
  frequency_minutes: number;
  webhook_url: string | null;
  email: string | null;
  last_value: number | string | null;
  last_triggered_at: string | null;
  last_checked_at: string | null;
  last_error: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v);
}

function mapAlert(row: AlertRow): DashboardAlert {
  return {
    id: row.id,
    projectId: row.project_id,
    widgetId: row.widget_id,
    label: row.label,
    operator: row.operator as AlertOperator,
    threshold: toNum(row.threshold),
    frequencyMinutes: row.frequency_minutes,
    webhookUrl: row.webhook_url,
    email: row.email,
    lastValue:
      row.last_value === null || row.last_value === undefined
        ? null
        : toNum(row.last_value),
    lastTriggeredAt: row.last_triggered_at,
    lastCheckedAt: row.last_checked_at,
    lastError: row.last_error,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, project_id, widget_id, label, operator, threshold, frequency_minutes, webhook_url, email, last_value, last_triggered_at, last_checked_at, last_error, enabled, created_at, updated_at";

export async function listAlerts(
  client: SupabaseClient,
  projectId: string,
): Promise<DashboardAlert[]> {
  const { data, error } = await client
    .from("dashboard_alerts")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAlert(row as AlertRow));
}

export async function createAlert(
  client: SupabaseClient,
  projectId: string,
  input: AlertInput,
): Promise<DashboardAlert> {
  const { data, error } = await client
    .from("dashboard_alerts")
    .insert({
      project_id: projectId,
      widget_id: input.widgetId,
      label: input.label,
      operator: input.operator,
      threshold: input.threshold,
      frequency_minutes: Math.max(5, input.frequencyMinutes),
      webhook_url: input.webhookUrl ?? null,
      email: input.email ?? null,
      enabled: input.enabled ?? true,
    })
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapAlert(data as AlertRow);
}

export async function updateAlert(
  client: SupabaseClient,
  alertId: string,
  patch: Partial<AlertInput> & { enabled?: boolean },
): Promise<DashboardAlert> {
  const update: Record<string, unknown> = {};
  if (patch.label !== undefined) update.label = patch.label;
  if (patch.operator !== undefined) update.operator = patch.operator;
  if (patch.threshold !== undefined) update.threshold = patch.threshold;
  if (patch.frequencyMinutes !== undefined)
    update.frequency_minutes = Math.max(5, patch.frequencyMinutes);
  if (patch.webhookUrl !== undefined) update.webhook_url = patch.webhookUrl;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.enabled !== undefined) update.enabled = patch.enabled;

  const { data, error } = await client
    .from("dashboard_alerts")
    .update(update)
    .eq("id", alertId)
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapAlert(data as AlertRow);
}

export async function deleteAlert(client: SupabaseClient, alertId: string) {
  const { error } = await client
    .from("dashboard_alerts")
    .delete()
    .eq("id", alertId);
  if (error) throw new Error(error.message);
}

/**
 * Find alerts that are due to run.
 * Admin-only — uses service role to ignore RLS.
 */
export async function listDueAlerts(
  admin: SupabaseClient,
): Promise<DashboardAlert[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("dashboard_alerts")
    .select(SELECT)
    .eq("enabled", true)
    // Either never checked OR last_checked + frequency_minutes minutes < now.
    // Using OR string syntax for PostgREST.
    .or(
      `last_checked_at.is.null,last_checked_at.lt.${new Date(
        Date.now() - 60_000, // a minute of slack — exact freq enforced below
      ).toISOString()}`,
    )
    .limit(100);

  if (error) throw new Error(error.message);

  const all = (data ?? []).map((row) => mapAlert(row as AlertRow));
  // Strict: only those whose interval has actually elapsed.
  const now = new Date(nowIso).getTime();
  return all.filter((a) => {
    if (!a.lastCheckedAt) return true;
    const last = new Date(a.lastCheckedAt).getTime();
    return now - last >= a.frequencyMinutes * 60_000;
  });
}

export async function recordAlertCheck(
  admin: SupabaseClient,
  alertId: string,
  patch: {
    lastValue?: number | null;
    lastTriggeredAt?: string | null;
    lastError?: string | null;
  },
): Promise<void> {
  const update: Record<string, unknown> = {
    last_checked_at: new Date().toISOString(),
  };
  if (patch.lastValue !== undefined) update.last_value = patch.lastValue;
  if (patch.lastTriggeredAt !== undefined)
    update.last_triggered_at = patch.lastTriggeredAt;
  if (patch.lastError !== undefined) update.last_error = patch.lastError;

  await admin.from("dashboard_alerts").update(update).eq("id", alertId);
}
