import type { Dataset, DataValue } from "./types";
import type {
  AggregationMetric,
  SortDirection,
  TimeGrain,
} from "./builder-types";

function formatLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function resolveMetric(metric?: AggregationMetric): AggregationMetric {
  return metric ?? "sum";
}

export function metricLabel(metric?: AggregationMetric): string {
  const resolved = resolveMetric(metric);
  if (resolved === "countDistinct") return "Distinct Count";
  return resolved.charAt(0).toUpperCase() + resolved.slice(1);
}

export function aggregationSubtitle(options: {
  metric?: AggregationMetric;
  valueField: string;
  groupField?: string;
  timeGrain?: TimeGrain;
}): string {
  const metricText = metricLabel(options.metric);
  const valueText = formatLabel(options.valueField);

  if (options.timeGrain) {
    const grain =
      options.timeGrain.charAt(0).toUpperCase() + options.timeGrain.slice(1);
    return `${metricText} of ${valueText} by ${grain}`;
  }

  if (options.groupField) {
    return `${metricText} of ${valueText} by ${formatLabel(options.groupField)}`;
  }

  return `${metricText} of ${valueText}`;
}

export function bucketByTimeGrain(value: unknown, grain?: TimeGrain): string {
  if (!grain) return String(value ?? "(empty)");
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return String(value ?? "(empty)");

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  if (grain === "year") return `${year}`;
  if (grain === "quarter")
    return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  if (grain === "month") return `${year}-${month}`;
  if (grain === "day") return `${year}-${month}-${day}`;

  const dayOfWeek = date.getUTCDay();
  const daysToMonday = (dayOfWeek + 6) % 7;
  const weekStart = new Date(date);
  weekStart.setUTCDate(date.getUTCDate() - daysToMonday);
  const wYear = weekStart.getUTCFullYear();
  const wMonth = `${weekStart.getUTCMonth() + 1}`.padStart(2, "0");
  const wDay = `${weekStart.getUTCDate()}`.padStart(2, "0");
  return `${wYear}-${wMonth}-${wDay}`;
}

export function computeMetric(
  data: Dataset,
  field: string,
  metric?: AggregationMetric,
): number {
  const resolved = resolveMetric(metric);

  if (resolved === "count") return data.length;

  if (resolved === "countDistinct") {
    const distinct = new Set<string>();
    for (const row of data) distinct.add(String(row[field] ?? "(empty)"));
    return distinct.size;
  }

  const nums = data
    .map((row) => toNumber(row[field]))
    .filter((v): v is number => v !== null);

  if (!nums.length) return 0;
  if (resolved === "min") return Math.min(...nums);
  if (resolved === "max") return Math.max(...nums);
  if (resolved === "avg") return nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((a, b) => a + b, 0);
}

export function aggregateByGroup(
  data: Dataset,
  groupField: string,
  valueField: string,
  options?: {
    metric?: AggregationMetric;
    sort?: SortDirection;
    topN?: number;
    timeGrain?: TimeGrain;
  },
): Dataset {
  const metric = resolveMetric(options?.metric);
  const grouped = new Map<DataValue, Dataset>();

  for (const row of data) {
    const key = options?.timeGrain
      ? bucketByTimeGrain(row[groupField], options.timeGrain)
      : (row[groupField] ?? "(empty)");
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  const rows = Array.from(grouped.entries()).map(([key, rowsForKey]) => ({
    [groupField]: key,
    [valueField]: computeMetric(rowsForKey, valueField, metric),
  }));

  const sort = options?.sort ?? "desc";
  rows.sort((a, b) => {
    const av = toNumber(a[valueField]) ?? 0;
    const bv = toNumber(b[valueField]) ?? 0;
    return sort === "asc" ? av - bv : bv - av;
  });

  const topN = options?.topN;
  if (!topN || topN <= 0) return rows;
  return rows.slice(0, topN);
}

export function buildLineSeries(
  data: Dataset,
  xField: string,
  yField: string,
): Dataset {
  return data.map((row) => ({
    [xField]: row[xField],
    [yField]: toNumber(row[yField]) ?? 0,
  }));
}

export function aggregateLineSeries(
  data: Dataset,
  xField: string,
  yField: string,
  options?: {
    metric?: AggregationMetric;
    timeGrain?: TimeGrain;
  },
): Dataset {
  const metric = resolveMetric(options?.metric);
  const grouped = new Map<string, Dataset>();

  for (const row of data) {
    const key = options?.timeGrain
      ? bucketByTimeGrain(row[xField], options.timeGrain)
      : String(row[xField] ?? "(empty)");
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries()).map(([key, rows]) => ({
    [xField]: key,
    [yField]: computeMetric(rows, yField, metric),
  }));
}
