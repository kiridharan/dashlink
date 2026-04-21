"use client";

import Link from "next/link";
import { useState } from "react";
import type { AlertOperator, DashboardAlert } from "@/lib/supabase/alerts";

interface Props {
  projectId: string;
  projectName: string;
  kpiWidgets: Array<{ id: string; label: string; field: string }>;
  initialAlerts: DashboardAlert[];
}

const OPERATOR_OPTIONS: Array<{ value: AlertOperator; label: string }> = [
  { value: "gt", label: "Greater than (>)" },
  { value: "lt", label: "Less than (<)" },
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
  { value: "eq", label: "Equals (=)" },
  { value: "change_pct", label: "% change ≥" },
];

export default function AlertsClient({
  projectId,
  projectName,
  kpiWidgets,
  initialAlerts,
}: Props) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>(initialAlerts);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [widgetId, setWidgetId] = useState(kpiWidgets[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [operator, setOperator] = useState<AlertOperator>("gt");
  const [threshold, setThreshold] = useState("0");
  const [frequencyMinutes, setFrequencyMinutes] = useState("60");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = async () => {
    if (!widgetId) {
      setError("Pick a KPI widget first");
      return;
    }
    if (!webhookUrl && !email) {
      setError("Add a webhook URL or email so you'll be notified");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId,
          label: label.trim() || `Alert on ${widgetId}`,
          operator,
          threshold: Number(threshold) || 0,
          frequencyMinutes: Math.max(5, Number(frequencyMinutes) || 60),
          webhookUrl: webhookUrl.trim() || null,
          email: email.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAlerts((prev) => [json.alert, ...prev]);
      setLabel("");
      setWebhookUrl("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (alert: DashboardAlert) => {
    const next = !alert.enabled;
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, enabled: next } : a)),
    );
    await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  };

  const handleDelete = async (alert: DashboardAlert) => {
    if (!confirm(`Delete alert "${alert.label}"?`)) return;
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    await fetch(`/api/alerts/${alert.id}`, { method: "DELETE" });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              ← Back to builder
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-semibold text-zinc-900">
              {projectName}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              Alerts
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        {/* Create form */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">
            New scheduled alert
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Re-fetches your data on a schedule and notifies you when a KPI
            crosses a threshold.
          </p>

          {kpiWidgets.length === 0 ? (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Add a KPI widget to your dashboard before creating alerts.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="col-span-2">
                <span className="text-xs text-zinc-500">Widget</span>
                <select
                  value={widgetId}
                  onChange={(e) => setWidgetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  {kpiWidgets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label} ({w.field})
                    </option>
                  ))}
                </select>
              </label>

              <label className="col-span-2">
                <span className="text-xs text-zinc-500">Label</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Daily revenue dropped"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-zinc-500">Condition</span>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as AlertOperator)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  {OPERATOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs text-zinc-500">Threshold</span>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-zinc-500">
                  Check every (minutes)
                </span>
                <input
                  type="number"
                  min={5}
                  value={frequencyMinutes}
                  onChange={(e) => setFrequencyMinutes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-zinc-500">Webhook URL</span>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/…"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="col-span-2">
                <span className="text-xs text-zinc-500">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>

              {error && (
                <div className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="col-span-2 flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create alert"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Existing alerts */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">
            Active alerts ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
              No alerts yet.
            </p>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {a.label}
                    </span>
                    {!a.enabled && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                        paused
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {a.operator} {a.threshold} · every {a.frequencyMinutes}m ·{" "}
                    {a.webhookUrl ? "webhook" : (a.email ?? "—")}
                    {a.lastValue !== null && (
                      <span className="ml-2 text-zinc-400">
                        last: {a.lastValue}
                      </span>
                    )}
                    {a.lastError && (
                      <span className="ml-2 text-red-500">
                        error: {a.lastError}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(a)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50"
                  >
                    {a.enabled ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
