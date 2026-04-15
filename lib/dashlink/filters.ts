import type { DashboardFilter } from "./builder-types";
import type { Dataset, DataValue } from "./types";

function normalizeValue(value: DataValue): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  return String(value);
}

function toDateValue(value: DataValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getDatasetFields(data: Dataset): string[] {
  return data.length > 0 ? Object.keys(data[0]) : [];
}

export function getDateFields(data: Dataset): string[] {
  if (data.length === 0) return [];
  const fields = Object.keys(data[0]);
  return fields.filter((field) => {
    const samples = data.slice(0, 20).map((row) => row[field]);
    const nonNull = samples.filter(
      (v) => v !== null && v !== undefined && v !== "",
    );
    if (nonNull.length === 0) return false;
    return nonNull.every((v) => typeof v === "string" && /^\d{4}[-/]/.test(v));
  });
}

export function getFieldValueOptions(data: Dataset, field: string): string[] {
  const values = new Set<string>();

  for (const row of data) {
    values.add(normalizeValue(row[field] ?? null));
  }

  return Array.from(values).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

export function applyDashboardFilters(
  data: Dataset,
  filters: DashboardFilter[],
): Dataset {
  if (filters.length === 0) return data;

  return data.filter((row) =>
    filters.every((filter) => {
      if (filter.type === "value") {
        return normalizeValue(row[filter.field] ?? null) === filter.value;
      }

      if (filter.type === "dateRange") {
        const val = toDateValue(row[filter.field]);
        if (!val) return false;
        const from = new Date(filter.from);
        const to = new Date(filter.to);
        // set to end of day for inclusive range
        to.setHours(23, 59, 59, 999);
        return val >= from && val <= to;
      }

      const query = filter.query.trim().toLowerCase();
      if (!query) return true;

      return Object.values(row).some((value) =>
        normalizeValue(value).toLowerCase().includes(query),
      );
    }),
  );
}

export function formatDashboardFilterLabel(filter: DashboardFilter): string {
  if (filter.type === "search") {
    return `Contains: ${filter.query}`;
  }

  if (filter.type === "dateRange") {
    return `${filter.field}: ${filter.from} → ${filter.to}`;
  }

  return `${filter.field}: ${filter.value}`;
}
