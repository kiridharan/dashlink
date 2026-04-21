// Lightweight diff between two dashboard versions.
// Returns added/removed widgets and per-widget field changes.

import type { DashWidget } from "./builder-types";

export interface WidgetDiff {
  id: string;
  type: "added" | "removed" | "changed";
  widget: DashWidget;
  changes?: Array<{ field: string; before: unknown; after: unknown }>;
}

function widgetByKey(list: DashWidget[]): Map<string, DashWidget> {
  const map = new Map<string, DashWidget>();
  list.forEach((w) => map.set(w.id, w));
  return map;
}

function shallowDiff(a: DashWidget, b: DashWidget) {
  const aRec = a as unknown as Record<string, unknown>;
  const bRec = b as unknown as Record<string, unknown>;
  const fields = new Set([...Object.keys(aRec), ...Object.keys(bRec)]);
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];
  fields.forEach((field) => {
    const before = aRec[field];
    const after = bRec[field];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field, before, after });
    }
  });
  return changes;
}

export function diffWidgets(
  before: DashWidget[],
  after: DashWidget[],
): WidgetDiff[] {
  const beforeMap = widgetByKey(before);
  const afterMap = widgetByKey(after);
  const result: WidgetDiff[] = [];

  afterMap.forEach((widget, id) => {
    const prev = beforeMap.get(id);
    if (!prev) {
      result.push({ id, type: "added", widget });
      return;
    }
    const changes = shallowDiff(prev, widget);
    if (changes.length > 0) {
      result.push({ id, type: "changed", widget, changes });
    }
  });

  beforeMap.forEach((widget, id) => {
    if (!afterMap.has(id)) {
      result.push({ id, type: "removed", widget });
    }
  });

  return result;
}
