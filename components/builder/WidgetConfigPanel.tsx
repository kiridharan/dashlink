"use client";

import React from "react";
import type {
  AggregationMetric,
  DashWidget,
  SortDirection,
  TimeGrain,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";

// ---- Field kind inference ----
type FieldKind = "numeric" | "date" | "text";

function inferFieldKind(samples: unknown[]): FieldKind {
  const clean = samples.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (!clean.length) return "text";
  if (
    clean.every(
      (v) =>
        typeof v === "number" ||
        (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))),
    )
  )
    return "numeric";
  if (
    clean.every((v) => typeof v === "string" && /^\d{4}[-/]/.test(v as string))
  )
    return "date";
  return "text";
}

function getFields(data: Dataset) {
  const all = data.length > 0 ? Object.keys(data[0]) : [];
  const kindByField = Object.fromEntries(
    all.map((field) => [
      field,
      inferFieldKind(data.slice(0, 20).map((row) => row[field])),
    ]),
  ) as Record<string, FieldKind>;
  const numeric = all.filter((f) => kindByField[f] === "numeric");
  const date = all.filter((f) => kindByField[f] === "date");
  const nonNumeric = all.filter((f) => !numeric.includes(f));
  return { all, numeric, date, nonNumeric, kindByField };
}

// ---- Styles ----
const SEL =
  "w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 hover:border-zinc-300 cursor-pointer truncate";
const NUM_INPUT =
  "w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 hover:border-zinc-300";
const TOGGLE =
  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors";
const TOGGLE_DOT =
  "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm";

// ---- Metric options with field-type awareness ----
const ALL_METRICS: Array<{
  value: AggregationMetric;
  label: string;
  help: string;
  requiresNumeric: boolean;
}> = [
  {
    value: "sum",
    label: "Sum",
    help: "Adds all numeric values.",
    requiresNumeric: true,
  },
  {
    value: "avg",
    label: "Average",
    help: "Average of numeric values.",
    requiresNumeric: true,
  },
  {
    value: "min",
    label: "Min",
    help: "Smallest numeric value.",
    requiresNumeric: true,
  },
  {
    value: "max",
    label: "Max",
    help: "Largest numeric value.",
    requiresNumeric: true,
  },
  {
    value: "count",
    label: "Count",
    help: "Counts rows in each group.",
    requiresNumeric: false,
  },
  {
    value: "countDistinct",
    label: "Distinct Count",
    help: "Unique values count.",
    requiresNumeric: false,
  },
];

const SORT_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "desc", label: "High → Low" },
  { value: "asc", label: "Low → High" },
];

const TIME_GRAIN_OPTIONS: Array<{ value: TimeGrain; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

const FISCAL_MONTHS: Array<{ value: number; label: string }> = [
  { value: 1, label: "January (calendar)" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

function FieldRow({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5">
      <label
        className="mb-1 block text-[10px] font-medium text-zinc-500"
        title={title}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2.5" title={title}>
      <span className="text-[10px] font-medium text-zinc-500">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${TOGGLE} ${checked ? "bg-zinc-900" : "bg-zinc-200"}`}
      >
        <span
          className={`${TOGGLE_DOT} ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

function uniqueValueCount(data: Dataset, field: string) {
  return new Set(data.map((row) => String(row[field] ?? "(empty)"))).size;
}

function getIntelligentMetrics(
  fieldKind: FieldKind | undefined,
  isGroupField?: boolean,
): typeof ALL_METRICS {
  // For group fields (high cardinality), prefer count/countDistinct
  if (isGroupField) {
    return ALL_METRICS;
  }
  // For non-numeric fields, only show count/countDistinct
  if (fieldKind && fieldKind !== "numeric") {
    return ALL_METRICS.filter((m) => !m.requiresNumeric);
  }
  return ALL_METRICS;
}

// ---- Main panel ----
interface Props {
  widget: DashWidget;
  data: Dataset;
  onUpdate: (patch: Partial<DashWidget>) => void;
  onClose: () => void;
}

export default function WidgetConfigPanel({
  widget,
  data,
  onUpdate,
  onClose,
}: Props) {
  const { all, numeric, date, nonNumeric, kindByField } = getFields(data);
  if (!all.length) return null;

  const metricFieldOptions = (metric?: AggregationMetric) =>
    metric === "count" || metric === "countDistinct"
      ? all
      : numeric.length > 0
        ? numeric
        : all;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            {widget.type}
          </span>
          <span className="text-[10px] text-zinc-300">config</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close config panel"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {/* ---- KPI Config ---- */}
        {widget.type === "kpi" && (
          <>
            <SectionLabel>Data</SectionLabel>
            <FieldRow label="Field" title="Pick the field used for this KPI">
              <select
                className={SEL}
                value={widget.field}
                onChange={(e) =>
                  onUpdate({ field: e.target.value } as Partial<DashWidget>)
                }
              >
                {all.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Metric" title="Choose the KPI calculation">
              <select
                className={SEL}
                value={widget.metric ?? "sum"}
                onChange={(e) =>
                  onUpdate({
                    metric: e.target.value as AggregationMetric,
                  } as Partial<DashWidget>)
                }
              >
                {getIntelligentMetrics(kindByField[widget.field]).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[9px] text-zinc-400">
                {
                  ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))
                    ?.help
                }
              </p>
            </FieldRow>

            <SectionLabel>Options</SectionLabel>
            <Toggle
              checked={widget.compareEnabled ?? false}
              onChange={(v) =>
                onUpdate({
                  compareEnabled: v,
                } as Partial<DashWidget>)
              }
              label="Compare to previous period"
              title="Shows delta compared to first half of data"
            />
            <Toggle
              checked={widget.hideNulls ?? false}
              onChange={(v) =>
                onUpdate({ hideNulls: v } as Partial<DashWidget>)
              }
              label="Hide null values"
              title="Exclude null/empty values from calculation"
            />
          </>
        )}

        {/* ---- Line Config ---- */}
        {widget.type === "line" && (
          <>
            <SectionLabel>Data</SectionLabel>
            <FieldRow label="X-Axis (Group)" title="Axis or grouping field">
              <select
                className={SEL}
                value={widget.x}
                onChange={(e) => {
                  const nextX = e.target.value;
                  const patch: Partial<DashWidget> = { x: nextX };
                  if (kindByField[nextX] !== "date") {
                    (patch as Record<string, unknown>).timeGrain = undefined;
                  }
                  onUpdate(patch);
                }}
              >
                {all.map((f) => (
                  <option key={f} value={f}>
                    {f}{" "}
                    {kindByField[f] === "date"
                      ? "📅"
                      : kindByField[f] === "numeric"
                        ? "123"
                        : ""}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Y-Axis (Value)" title="Field to measure">
              <select
                className={SEL}
                value={widget.y}
                onChange={(e) =>
                  onUpdate({ y: e.target.value } as Partial<DashWidget>)
                }
              >
                {metricFieldOptions(widget.metric).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Metric" title="How values are aggregated">
              <select
                className={SEL}
                value={widget.metric ?? "sum"}
                onChange={(e) =>
                  onUpdate({
                    metric: e.target.value as AggregationMetric,
                  } as Partial<DashWidget>)
                }
              >
                {getIntelligentMetrics(kindByField[widget.y]).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[9px] text-zinc-400">
                {
                  ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))
                    ?.help
                }
              </p>
            </FieldRow>

            {kindByField[widget.x] === "date" && (
              <FieldRow label="Time Grain" title="Bucket dates into periods">
                <select
                  className={SEL}
                  value={widget.timeGrain ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      timeGrain: (e.target.value || undefined) as
                        | TimeGrain
                        | undefined,
                    } as Partial<DashWidget>)
                  }
                >
                  <option value="">None</option>
                  {TIME_GRAIN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FieldRow>
            )}

            {widget.timeGrain &&
              (widget.timeGrain === "year" ||
                widget.timeGrain === "quarter") && (
                <FieldRow
                  label="Fiscal Year Start"
                  title="Month that starts the fiscal year (1=Jan, 4=Apr, etc.)"
                >
                  <select
                    className={SEL}
                    value={widget.customDateRange?.startMonth ?? 1}
                    onChange={(e) => {
                      const month = Number(e.target.value);
                      onUpdate({
                        customDateRange:
                          month === 1 ? undefined : { startMonth: month },
                      } as Partial<DashWidget>);
                    }}
                  >
                    {FISCAL_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[9px] text-zinc-400">
                    Calendar year when set to January.
                  </p>
                </FieldRow>
              )}

            <SectionLabel>Multi-group</SectionLabel>
            <FieldRow
              label="Second Group"
              title="Add a second grouping dimension"
            >
              <select
                className={SEL}
                value={widget.secondGroupBy ?? ""}
                onChange={(e) =>
                  onUpdate({
                    secondGroupBy: e.target.value || undefined,
                  } as Partial<DashWidget>)
                }
              >
                <option value="">None</option>
                {all
                  .filter((f) => f !== widget.x)
                  .map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
              </select>
            </FieldRow>

            <SectionLabel>Options</SectionLabel>
            <Toggle
              checked={widget.hideNulls ?? false}
              onChange={(v) =>
                onUpdate({ hideNulls: v } as Partial<DashWidget>)
              }
              label="Hide null values"
              title="Exclude null/empty values"
            />
          </>
        )}

        {/* ---- Bar Config ---- */}
        {widget.type === "bar" && (
          <>
            <SectionLabel>Data</SectionLabel>
            <FieldRow label="X-Axis (Group)" title="Grouping field">
              <select
                className={SEL}
                value={widget.x}
                onChange={(e) =>
                  onUpdate({ x: e.target.value } as Partial<DashWidget>)
                }
              >
                {all.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Y-Axis (Value)" title="Field to measure">
              <select
                className={SEL}
                value={widget.y}
                onChange={(e) =>
                  onUpdate({ y: e.target.value } as Partial<DashWidget>)
                }
              >
                {metricFieldOptions(widget.metric).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Metric" title="How values are aggregated">
              <select
                className={SEL}
                value={widget.metric ?? "sum"}
                onChange={(e) =>
                  onUpdate({
                    metric: e.target.value as AggregationMetric,
                  } as Partial<DashWidget>)
                }
              >
                {getIntelligentMetrics(kindByField[widget.y]).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[9px] text-zinc-400">
                {
                  ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))
                    ?.help
                }
              </p>
            </FieldRow>

            <SectionLabel>Sorting &amp; Limits</SectionLabel>
            <FieldRow label="Sort" title="Sort by aggregated value">
              <select
                className={SEL}
                value={widget.sort ?? "desc"}
                onChange={(e) =>
                  onUpdate({
                    sort: e.target.value as SortDirection,
                  } as Partial<DashWidget>)
                }
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Top N" title="Limit displayed groups">
              <input
                type="number"
                min={1}
                max={50}
                className={NUM_INPUT}
                value={widget.topN ?? ""}
                onChange={(e) =>
                  onUpdate({
                    topN: e.target.value ? Number(e.target.value) : undefined,
                  } as Partial<DashWidget>)
                }
                placeholder="All"
              />
            </FieldRow>

            <SectionLabel>Multi-group</SectionLabel>
            <FieldRow
              label="Second Group"
              title="Add a second grouping dimension"
            >
              <select
                className={SEL}
                value={widget.secondGroupBy ?? ""}
                onChange={(e) =>
                  onUpdate({
                    secondGroupBy: e.target.value || undefined,
                  } as Partial<DashWidget>)
                }
              >
                <option value="">None</option>
                {all
                  .filter((f) => f !== widget.x)
                  .map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
              </select>
            </FieldRow>

            <SectionLabel>Options</SectionLabel>
            {(widget.topN ?? 0) > 0 && (
              <Toggle
                checked={widget.showOtherBucket ?? false}
                onChange={(v) =>
                  onUpdate({
                    showOtherBucket: v,
                  } as Partial<DashWidget>)
                }
                label={`Show "Other" bucket`}
                title="Aggregate remaining groups into an Other category"
              />
            )}
            <Toggle
              checked={widget.hideNulls ?? false}
              onChange={(v) =>
                onUpdate({ hideNulls: v } as Partial<DashWidget>)
              }
              label="Hide null values"
              title="Exclude null/empty values"
            />
            {widget.metric === "countDistinct" &&
              uniqueValueCount(data, widget.x) > 50 && (
                <p className="text-[9px] text-amber-600">
                  High cardinality ({uniqueValueCount(data, widget.x)} unique
                  values). Consider adding a Top N limit.
                </p>
              )}
          </>
        )}

        {/* ---- Pie Config ---- */}
        {widget.type === "pie" && (
          <>
            <SectionLabel>Data</SectionLabel>
            <FieldRow label="Category" title="Category field">
              <select
                className={SEL}
                value={widget.category}
                onChange={(e) =>
                  onUpdate({
                    category: e.target.value,
                  } as Partial<DashWidget>)
                }
              >
                {(nonNumeric.length > 0 ? nonNumeric : all).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Value" title="Field to measure">
              <select
                className={SEL}
                value={widget.value}
                onChange={(e) =>
                  onUpdate({ value: e.target.value } as Partial<DashWidget>)
                }
              >
                {metricFieldOptions(widget.metric).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Metric" title="How values are aggregated">
              <select
                className={SEL}
                value={widget.metric ?? "sum"}
                onChange={(e) =>
                  onUpdate({
                    metric: e.target.value as AggregationMetric,
                  } as Partial<DashWidget>)
                }
              >
                {getIntelligentMetrics(kindByField[widget.value]).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[9px] text-zinc-400">
                {
                  ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))
                    ?.help
                }
              </p>
            </FieldRow>

            <SectionLabel>Sorting &amp; Limits</SectionLabel>
            <FieldRow label="Sort" title="Sort by aggregated value">
              <select
                className={SEL}
                value={widget.sort ?? "desc"}
                onChange={(e) =>
                  onUpdate({
                    sort: e.target.value as SortDirection,
                  } as Partial<DashWidget>)
                }
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Top N" title="Limit displayed slices">
              <input
                type="number"
                min={1}
                max={50}
                className={NUM_INPUT}
                value={widget.topN ?? ""}
                onChange={(e) =>
                  onUpdate({
                    topN: e.target.value ? Number(e.target.value) : undefined,
                  } as Partial<DashWidget>)
                }
                placeholder="8"
              />
            </FieldRow>

            <SectionLabel>Options</SectionLabel>
            {(widget.topN ?? 0) > 0 && (
              <Toggle
                checked={widget.showOtherBucket ?? false}
                onChange={(v) =>
                  onUpdate({
                    showOtherBucket: v,
                  } as Partial<DashWidget>)
                }
                label={`Show "Other" bucket`}
                title="Aggregate remaining slices into Other"
              />
            )}
            <Toggle
              checked={widget.hideNulls ?? false}
              onChange={(v) =>
                onUpdate({ hideNulls: v } as Partial<DashWidget>)
              }
              label="Hide null values"
              title="Exclude null/empty values"
            />
            {widget.metric === "countDistinct" &&
              uniqueValueCount(data, widget.category) > 50 && (
                <p className="text-[9px] text-amber-600">
                  High cardinality ({uniqueValueCount(data, widget.category)}{" "}
                  unique values). Consider adding a Top N limit.
                </p>
              )}
          </>
        )}

        {/* ---- Table ---- */}
        {widget.type === "table" && (
          <p className="text-[10px] text-zinc-400">
            Table widgets display the raw filtered data. No additional config is
            needed.
          </p>
        )}
      </div>
    </aside>
  );
}
