// ---------------------------------------------------------------------------
// Nested JSON → tabular Dataset flattening
// ---------------------------------------------------------------------------
//
// Handles arbitrary JSON shapes:
//   { user: { name: "A", address: { city: "X" } } }
//     → { "user.name": "A", "user.address.city": "X" }
//
//   { tags: ["red", "blue"] }
//     → { "tags": "red, blue", "tags.count": 2 }
//
//   { items: [{ price: 10 }, { price: 20 }] }
//     → expands by default to multiple rows when used at top level,
//       but inside a row collapses to summary fields:
//         { "items.count": 2, "items.0.price": 10, "items.1.price": 20 }
//
// Designed to be safe (no infinite recursion via depth limit) and predictable.

import type { DataRow, DataValue, Dataset } from "./types";

const MAX_DEPTH = 4;
const MAX_ARRAY_KEYS = 5; // expand only first N indexed children
const MAX_ROWS = 1000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPrimitive(v: unknown): v is DataValue {
  return (
    v === null ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  );
}

function joinPath(prefix: string, key: string | number): string {
  return prefix ? `${prefix}.${key}` : String(key);
}

/**
 * Flatten a single object into dot-keyed primitives.
 *
 * Arrays of primitives become a comma-joined string + a `.count` field.
 * Arrays of objects expand the first MAX_ARRAY_KEYS items by index.
 * Nested objects are recursed up to MAX_DEPTH.
 */
export function flattenObject(obj: unknown, prefix = "", depth = 0): DataRow {
  const out: DataRow = {};

  if (depth > MAX_DEPTH) {
    if (prefix) out[prefix] = safeString(obj);
    return out;
  }

  if (isPrimitive(obj)) {
    if (prefix) out[prefix] = obj;
    return out;
  }

  if (Array.isArray(obj)) {
    out[joinPath(prefix, "count")] = obj.length;

    if (obj.length === 0) return out;

    // Array of primitives → join + first
    if (obj.every(isPrimitive)) {
      const joined = obj
        .map((v) => (v === null ? "" : String(v)))
        .filter(Boolean)
        .join(", ");
      if (prefix) out[prefix] = joined.slice(0, 200);
      const numeric = obj.filter((v): v is number => typeof v === "number");
      if (numeric.length) {
        out[joinPath(prefix, "sum")] = numeric.reduce((a, b) => a + b, 0);
        out[joinPath(prefix, "avg")] =
          numeric.reduce((a, b) => a + b, 0) / numeric.length;
      }
      return out;
    }

    // Array of objects → expand first N
    obj.slice(0, MAX_ARRAY_KEYS).forEach((item, i) => {
      Object.assign(out, flattenObject(item, joinPath(prefix, i), depth + 1));
    });
    return out;
  }

  if (isPlainObject(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      Object.assign(
        out,
        flattenObject(value, joinPath(prefix, key), depth + 1),
      );
    }
    return out;
  }

  // Fallback (function, undefined, symbol, etc.)
  if (prefix) out[prefix] = safeString(obj);
  return out;
}

function safeString(v: unknown): DataValue {
  if (v === undefined) return null;
  try {
    return String(v);
  } catch {
    return null;
  }
}

/**
 * Convert any JSON value into a Dataset (array of flat rows).
 *
 * Strategy:
 *  1. If input is an array → flatten each element.
 *  2. If input is an object containing exactly one array property → use that.
 *  3. If input is an object with multiple arrays → use the longest array.
 *  4. Otherwise → wrap the single object in a 1-row dataset.
 */
export function flattenJsonToDataset(input: unknown): Dataset {
  if (input === null || input === undefined) return [];

  if (Array.isArray(input)) {
    return input.slice(0, MAX_ROWS).map((item) => flattenObject(item));
  }

  if (isPlainObject(input)) {
    // Look for the most array-like property to use as rows.
    const arrayEntries = Object.entries(input).filter(([, v]) =>
      Array.isArray(v),
    ) as Array<[string, unknown[]]>;

    if (arrayEntries.length > 0) {
      // Pick the longest array; bias toward arrays of objects.
      const best = arrayEntries.reduce((a, b) => {
        const aScore = a[1].length + (a[1].some(isPlainObject) ? 1000 : 0);
        const bScore = b[1].length + (b[1].some(isPlainObject) ? 1000 : 0);
        return bScore > aScore ? b : a;
      });
      return best[1].slice(0, MAX_ROWS).map((item) => flattenObject(item));
    }

    // No arrays → single-row dataset of the object.
    return [flattenObject(input)];
  }

  if (isPrimitive(input)) {
    return [{ value: input }];
  }

  return [];
}

/**
 * Discover all dot-paths inside an object that point to an array.
 * Used to power the "select data path" step in the wizard.
 */
export function findArrayPathsDeep(
  obj: unknown,
  prefix = "",
  depth = 0,
): Array<{ path: string; length: number; sample: string }> {
  if (depth > MAX_DEPTH || !isPlainObject(obj)) return [];

  const results: Array<{ path: string; length: number; sample: string }> = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = joinPath(prefix, key);

    if (Array.isArray(value)) {
      const first = value[0];
      const sample = isPlainObject(first)
        ? `[${Object.keys(first).slice(0, 3).join(", ")}…]`
        : isPrimitive(first)
          ? String(first).slice(0, 30)
          : "…";
      results.push({ path, length: value.length, sample });
    } else if (isPlainObject(value)) {
      results.push(...findArrayPathsDeep(value, path, depth + 1));
    }
  }

  return results;
}
