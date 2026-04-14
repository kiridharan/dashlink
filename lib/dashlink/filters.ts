import type { DashboardFilter } from "./builder-types";
import type { Dataset, DataValue } from "./types";

function normalizeValue(value: DataValue): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  return String(value);
}

export function getDatasetFields(data: Dataset): string[] {
  return data.length > 0 ? Object.keys(data[0]) : [];
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

  return `${filter.field}: ${filter.value}`;
}
