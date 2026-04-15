"use client";

import React from "react";
import type {
  AggregationMetric,
  SortDirection,
  TimeGrain,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";

// ---- Field kind inference ----
export type FieldKind = "numeric" | "date" | "text";

export function inferFieldKind(samples: unknown[]): FieldKind {
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

export function getFields(data: Dataset) {
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
export const SEL =
  "w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 hover:border-zinc-300 cursor-pointer truncate";
export const NUM_INPUT =
  "w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 hover:border-zinc-300";

// ---- Metric options with field-type awareness ----
export const ALL_METRICS: Array<{
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

export const SORT_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "desc", label: "High → Low" },
  { value: "asc", label: "Low → High" },
];

export const TIME_GRAIN_OPTIONS: Array<{ value: TimeGrain; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export const FISCAL_MONTHS: Array<{ value: number; label: string }> = [
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

// ---- Shared components ----
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

export function FieldRow({
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

const TOGGLE_STYLE =
  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors";
const TOGGLE_DOT_STYLE =
  "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm";

export function Toggle({
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
        className={`${TOGGLE_STYLE} ${checked ? "bg-zinc-900" : "bg-zinc-200"}`}
      >
        <span
          className={`${TOGGLE_DOT_STYLE} ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export function uniqueValueCount(data: Dataset, field: string) {
  return new Set(data.map((row) => String(row[field] ?? "(empty)"))).size;
}

export function getIntelligentMetrics(
  fieldKind: FieldKind | undefined,
  isGroupField?: boolean,
): typeof ALL_METRICS {
  if (isGroupField) return ALL_METRICS;
  if (fieldKind && fieldKind !== "numeric") {
    return ALL_METRICS.filter((m) => !m.requiresNumeric);
  }
  return ALL_METRICS;
}

export function metricFieldOptions(
  all: string[],
  numeric: string[],
  metric?: AggregationMetric,
) {
  return metric === "count" || metric === "countDistinct"
    ? all
    : numeric.length > 0
      ? numeric
      : all;
}
