import type { Dataset, DashboardConfig, ChartConfig } from "./types";
import { formatLabel } from "./utils";

type FieldKind = "date" | "numeric" | "categorical" | "unknown";

// ---------------------------------------------------------------------------
// Field-type inference helpers
// ---------------------------------------------------------------------------

function isDateLike(value: string): boolean {
  return (
    /^\d{4}-\d{2}(-\d{2})?$/.test(value) || // ISO: 2024-01, 2024-01-15
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\s+\d{4})?$/i.test(
      value,
    ) || // Jan, Jan 2024
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value) || // 1/15/2024
    /^Q[1-4]\s+\d{4}$/.test(value) // Q1 2024
  );
}

function inferFieldKind(
  values: Array<string | number | null | boolean>,
): FieldKind {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );

  if (nonNull.length === 0) return "unknown";

  // Numeric: every value is a number or numeric string
  if (
    nonNull.every(
      (v) =>
        typeof v === "number" ||
        (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))),
    )
  ) {
    return "numeric";
  }

  // Date-like strings
  if (nonNull.every((v) => typeof v === "string" && isDateLike(v))) {
    return "date";
  }

  // Categorical: all strings with low cardinality
  const uniqueValues = new Set(nonNull);
  if (
    nonNull.every((v) => typeof v === "string") &&
    uniqueValues.size <= Math.max(8, Math.floor(nonNull.length * 0.4))
  ) {
    return "categorical";
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Main schema detection
// ---------------------------------------------------------------------------

/**
 * Inspect a dataset and produce a DashboardConfig:
 * - date × numeric  → line chart
 * - categorical × numeric → bar chart
 * - numeric fields (up to 4) → KPI cards
 * - everything else → table
 */
export function detectSchema(data: Dataset, apiUrl: string): DashboardConfig {
  if (!data.length) {
    return {
      title: "Dashboard",
      apiUrl,
      charts: [],
      kpis: [],
      showTable: false,
    };
  }

  const fields = Object.keys(data[0]);
  const kinds = new Map<string, FieldKind>();

  for (const field of fields) {
    const values = data.map((row) => row[field]);
    kinds.set(field, inferFieldKind(values));
  }

  const dateFields = fields.filter((f) => kinds.get(f) === "date");
  const numericFields = fields.filter((f) => kinds.get(f) === "numeric");
  const categoricalFields = fields.filter(
    (f) => kinds.get(f) === "categorical",
  );

  const charts: ChartConfig[] = [];

  // One line chart: first date × first numeric
  if (dateFields.length > 0 && numericFields.length > 0) {
    const xField = dateFields[0];
    const yField = numericFields[0];
    charts.push({
      type: "line",
      x: xField,
      y: yField,
      label: `${formatLabel(yField)} Over Time`,
    });
  }

  // One bar chart: first categorical × first or second numeric
  if (categoricalFields.length > 0 && numericFields.length > 0) {
    const xField = categoricalFields[0];
    // Prefer a different numeric than what's already used in line chart
    const usedY = charts[0]?.y;
    const yField = numericFields.find((f) => f !== usedY) ?? numericFields[0];
    charts.push({
      type: "bar",
      x: xField,
      y: yField,
      label: `${formatLabel(yField)} by ${formatLabel(xField)}`,
    });
  }

  // KPIs: up to 4 numeric fields
  const kpis = numericFields.slice(0, 4);

  return {
    title: "API Dashboard",
    apiUrl,
    charts,
    kpis,
    showTable: data.length > 0,
  };
}
