import type { Dataset, DataValue } from "./types";

/**
 * Aggregate a dataset by grouping on `xField` and summing `yField`.
 * Used to prepare data for bar charts where the x-axis has repeated values.
 */
export function aggregateByField(
  data: Dataset,
  xField: string,
  yField: string,
): Dataset {
  const groups = new Map<DataValue, number>();
  for (const row of data) {
    const key = row[xField] ?? "(empty)";
    const raw = row[yField];
    const val = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
    if (!isNaN(val)) {
      groups.set(key, (groups.get(key) ?? 0) + val);
    }
  }
  return Array.from(groups.entries()).map(([k, v]) => ({
    [xField]: k,
    [yField]: v,
  }));
}

/** Format large numbers compactly: 1200000 → "1.2M", 42300 → "42.3K" */
export function formatNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** "total_revenue" → "Total Revenue", "avgOrderVal" → "Avg Order Val" */
export function formatLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compute sum of a numeric field across the dataset. */
export function sumField(data: Dataset, field: string): number {
  return data.reduce((acc, row) => {
    const raw = row[field];
    const val = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
}
