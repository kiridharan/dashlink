import type { FilterControl, FilterState, FilterValue } from "./builder-types";
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

function toNumberValue(value: DataValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// ---- Field discovery helpers ----

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

export function getNumericFields(data: Dataset): string[] {
  if (data.length === 0) return [];
  const fields = Object.keys(data[0]);
  return fields.filter((field) => {
    const samples = data.slice(0, 20).map((row) => row[field]);
    const nonNull = samples.filter(
      (v) => v !== null && v !== undefined && v !== "",
    );
    if (nonNull.length === 0) return false;
    return nonNull.every((v) => typeof v === "number" || !isNaN(Number(v)));
  });
}

export function getCategoricalFields(data: Dataset): string[] {
  const numeric = new Set(getNumericFields(data));
  const dates = new Set(getDateFields(data));
  return getDatasetFields(data).filter((f) => !numeric.has(f) && !dates.has(f));
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

export function getFieldNumericRange(
  data: Dataset,
  field: string,
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const row of data) {
    const n = toNumberValue(row[field]);
    if (n === null) continue;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (min === Infinity || max === -Infinity) return null;
  return { min, max };
}

// ---- Default values ----

export function defaultValueFor(control: FilterControl): FilterValue {
  switch (control.type) {
    case "select":
      return { type: "select", value: null };
    case "multiSelect":
      return { type: "multiSelect", values: [] };
    case "dateRange":
      return { type: "dateRange", from: null, to: null };
    case "numberRange":
      return { type: "numberRange", min: null, max: null };
    case "search":
      return { type: "search", query: "" };
  }
}

export function controlLabel(control: FilterControl): string {
  if (control.label && control.label.trim()) return control.label.trim();
  if (control.type === "search") return "Search";
  return control.field;
}

function isActive(value: FilterValue): boolean {
  switch (value.type) {
    case "select":
      return value.value !== null && value.value !== "";
    case "multiSelect":
      return value.values.length > 0;
    case "dateRange":
      return Boolean(value.from || value.to);
    case "numberRange":
      return value.min !== null || value.max !== null;
    case "search":
      return value.query.trim().length > 0;
    default:
      return false;
  }
}

// ---- Apply controls + state to a dataset ----

export function applyFilterControls(
  data: Dataset,
  controls: FilterControl[],
  state: FilterState,
): Dataset {
  if (controls.length === 0) return data;

  const active = controls
    .map((control) => ({
      control,
      value: state[control.id] ?? defaultValueFor(control),
    }))
    .filter((entry) => isActive(entry.value));

  if (active.length === 0) return data;

  return data.filter((row) =>
    active.every(({ control, value }) => {
      switch (control.type) {
        case "select": {
          if (value.type !== "select" || value.value === null) return true;
          return normalizeValue(row[control.field] ?? null) === value.value;
        }
        case "multiSelect": {
          if (value.type !== "multiSelect" || value.values.length === 0)
            return true;
          return value.values.includes(
            normalizeValue(row[control.field] ?? null),
          );
        }
        case "dateRange": {
          if (value.type !== "dateRange") return true;
          const cell = toDateValue(row[control.field]);
          if (!cell) return false;
          if (value.from) {
            const from = new Date(value.from);
            if (cell < from) return false;
          }
          if (value.to) {
            const to = new Date(value.to);
            to.setHours(23, 59, 59, 999);
            if (cell > to) return false;
          }
          return true;
        }
        case "numberRange": {
          if (value.type !== "numberRange") return true;
          const cell = toNumberValue(row[control.field]);
          if (cell === null) return false;
          if (value.min !== null && cell < value.min) return false;
          if (value.max !== null && cell > value.max) return false;
          return true;
        }
        case "search": {
          if (value.type !== "search") return true;
          const query = value.query.trim().toLowerCase();
          if (!query) return true;
          const fields: string[] = control.fields?.length
            ? control.fields
            : Object.keys(row);
          return fields.some((f: string) =>
            normalizeValue(row[f] ?? null)
              .toLowerCase()
              .includes(query),
          );
        }
      }
    }),
  );
}

export function activeFilterCount(
  controls: FilterControl[],
  state: FilterState,
): number {
  return controls.reduce((count, control) => {
    const value = state[control.id] ?? defaultValueFor(control);
    return isActive(value) ? count + 1 : count;
  }, 0);
}
