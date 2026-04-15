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

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === "";
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

export function bucketByTimeGrain(
  value: unknown,
  grain?: TimeGrain,
  fiscalStartMonth?: number,
): string {
  if (!grain) return String(value ?? "(empty)");
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return String(value ?? "(empty)");

  const year = date.getUTCFullYear();
  const monthNum = date.getUTCMonth() + 1; // 1-12
  const month = `${monthNum}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  // Fiscal year offset (e.g. fiscalStartMonth=4 means April start)
  const fyStart = fiscalStartMonth ?? 1;
  const fiscalYear = monthNum >= fyStart ? year : year - 1;

  if (grain === "year") {
    if (fyStart === 1) return `${year}`;
    return `FY${fiscalYear}`;
  }
  if (grain === "quarter") {
    if (fyStart === 1)
      return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    // Fiscal quarter: offset months by fiscal start
    const adjustedMonth = (monthNum - fyStart + 12) % 12;
    const fq = Math.floor(adjustedMonth / 3) + 1;
    return `FY${fiscalYear}-Q${fq}`;
  }
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

export function filterNulls(data: Dataset, field: string): Dataset {
  return data.filter((row) => !isNullish(row[field]));
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

// ---- Previous period comparison for KPIs ----

export interface PeriodComparison {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null; // null if previous was 0
}

export function computeKpiWithComparison(
  data: Dataset,
  field: string,
  metric?: AggregationMetric,
): PeriodComparison {
  // Split dataset in half: first half = previous, second half = current
  const midpoint = Math.floor(data.length / 2);
  const previousData = data.slice(0, midpoint);
  const currentData = data.slice(midpoint);

  const current = computeMetric(currentData, field, metric);
  const previous = computeMetric(previousData, field, metric);
  const delta = current - previous;
  const deltaPercent =
    previous !== 0 ? (delta / Math.abs(previous)) * 100 : null;

  return { current, previous, delta, deltaPercent };
}

// ---- "Other" bucket aggregation ----

export function aggregateByGroup(
  data: Dataset,
  groupField: string,
  valueField: string,
  options?: {
    metric?: AggregationMetric;
    sort?: SortDirection;
    topN?: number;
    timeGrain?: TimeGrain;
    showOtherBucket?: boolean;
    hideNulls?: boolean;
    fiscalStartMonth?: number;
  },
): Dataset {
  const metric = resolveMetric(options?.metric);

  let filteredData = data;
  if (options?.hideNulls) {
    filteredData = filteredData.filter(
      (row) => !isNullish(row[groupField]) && !isNullish(row[valueField]),
    );
  }

  const grouped = new Map<DataValue, Dataset>();

  for (const row of filteredData) {
    const key = options?.timeGrain
      ? bucketByTimeGrain(
          row[groupField],
          options.timeGrain,
          options.fiscalStartMonth,
        )
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

  if (options?.showOtherBucket && rows.length > topN) {
    const topRows = rows.slice(0, topN);
    const otherRows = rows.slice(topN);
    const otherValue = otherRows.reduce(
      (acc, row) => acc + (toNumber(row[valueField]) ?? 0),
      0,
    );
    topRows.push({
      [groupField]: "Other",
      [valueField]: otherValue,
    });
    return topRows;
  }

  return rows.slice(0, topN);
}

// ---- Multi-group aggregation ----

export function aggregateByMultipleGroups(
  data: Dataset,
  groupField: string,
  secondGroupField: string,
  valueField: string,
  options?: {
    metric?: AggregationMetric;
    hideNulls?: boolean;
  },
): Dataset {
  const metric = resolveMetric(options?.metric);

  let filteredData = data;
  if (options?.hideNulls) {
    filteredData = filteredData.filter(
      (row) =>
        !isNullish(row[groupField]) &&
        !isNullish(row[secondGroupField]) &&
        !isNullish(row[valueField]),
    );
  }

  const grouped = new Map<string, Dataset>();

  for (const row of filteredData) {
    const key = `${row[groupField] ?? "(empty)"}|||${row[secondGroupField] ?? "(empty)"}`;
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries()).map(([key, rowsForKey]) => {
    const [g1, g2] = key.split("|||");
    return {
      [groupField]: g1,
      [secondGroupField]: g2,
      [valueField]: computeMetric(rowsForKey, valueField, metric),
    };
  });
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
    hideNulls?: boolean;
    fiscalStartMonth?: number;
  },
): Dataset {
  const metric = resolveMetric(options?.metric);

  let filteredData = data;
  if (options?.hideNulls) {
    filteredData = filteredData.filter(
      (row) => !isNullish(row[xField]) && !isNullish(row[yField]),
    );
  }

  const grouped = new Map<string, Dataset>();

  for (const row of filteredData) {
    const key = options?.timeGrain
      ? bucketByTimeGrain(
          row[xField],
          options.timeGrain,
          options.fiscalStartMonth,
        )
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
