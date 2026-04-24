// Widget types used by the drag-and-drop dashboard builder

export type WidgetType = "kpi" | "line" | "bar" | "pie" | "table";

// ---- Aggregation model (Phase 1 foundation) ----
export type AggregationMetric =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "countDistinct";

export type TimeGrain = "day" | "week" | "month" | "quarter" | "year";
export type SortDirection = "asc" | "desc";

// ---- Interactive filter controls (creator defines, viewer supplies values) ----

export type FilterControlType =
  | "select"
  | "multiSelect"
  | "dateRange"
  | "numberRange"
  | "search";

interface FilterControlBase {
  id: string;
  label?: string;
}

export interface SelectControl extends FilterControlBase {
  type: "select";
  field: string;
}

export interface MultiSelectControl extends FilterControlBase {
  type: "multiSelect";
  field: string;
}

export interface DateRangeControl extends FilterControlBase {
  type: "dateRange";
  field: string;
}

export interface NumberRangeControl extends FilterControlBase {
  type: "numberRange";
  field: string;
}

export interface SearchControl extends FilterControlBase {
  type: "search";
  /** Optional whitelist of fields to search; defaults to all */
  fields?: string[];
}

export type FilterControl =
  | SelectControl
  | MultiSelectControl
  | DateRangeControl
  | NumberRangeControl
  | SearchControl;

export type FilterValue =
  | { type: "select"; value: string | null }
  | { type: "multiSelect"; values: string[] }
  | { type: "dateRange"; from: string | null; to: string | null }
  | { type: "numberRange"; min: number | null; max: number | null }
  | { type: "search"; query: string };

export type FilterState = Record<string, FilterValue>;

/**
 * @deprecated Use `FilterControl` instead. Kept as a type alias for callers
 * that still reference the old name during migration.
 */
export type DashboardFilter = FilterControl;

export interface CustomDateRange {
  startMonth: number; // 1-12, e.g. 4 for fiscal year starting in April
}

export interface AggregateOptions {
  metric?: AggregationMetric;
  groupBy?: string;
  timeGrain?: TimeGrain;
  sort?: SortDirection;
  topN?: number;
  showOtherBucket?: boolean;
  hideNulls?: boolean;
  customDateRange?: CustomDateRange;
}

// ---- Size descriptor ----
// `span`  : how many of 12 virtual columns the widget occupies
// `height`: pixel height — user-resizable
export interface GridItem {
  i: string; // widget id
  span: number; // 1–12 column span
  height: number; // px height
}

// ---- Widget configs ----
export interface KpiWidget {
  id: string;
  type: "kpi";
  field: string;
  label: string;
  /** Defaults to "sum" for backward compatibility */
  metric?: AggregationMetric;
  /** Show delta compared to previous period */
  compareEnabled?: boolean;
  hideNulls?: boolean;
}

export interface LineWidget {
  id: string;
  type: "line";
  x: string;
  y: string;
  label: string;
  /** Defaults to "sum" for backward compatibility */
  metric?: AggregationMetric;
  timeGrain?: TimeGrain;
  hideNulls?: boolean;
  customDateRange?: CustomDateRange;
  secondGroupBy?: string;
}

export interface BarWidget {
  id: string;
  type: "bar";
  x: string;
  y: string;
  label: string;
  /** Defaults to "sum" for backward compatibility */
  metric?: AggregationMetric;
  sort?: SortDirection;
  topN?: number;
  showOtherBucket?: boolean;
  hideNulls?: boolean;
  secondGroupBy?: string;
}

export interface PieWidget {
  id: string;
  type: "pie";
  category: string;
  value: string;
  label: string;
  /** Defaults to "sum" for backward compatibility */
  metric?: AggregationMetric;
  sort?: SortDirection;
  topN?: number;
  showOtherBucket?: boolean;
  hideNulls?: boolean;
}

export interface TableWidget {
  id: string;
  type: "table";
  columns?: string[];
}

export type DashWidget =
  | KpiWidget
  | LineWidget
  | BarWidget
  | PieWidget
  | TableWidget;

// ---- Conversion helper: DashboardConfig → initial widgets + layout ----
import type { DashboardConfig } from "./types";

export function configToWidgets(config: DashboardConfig): {
  widgets: DashWidget[];
  layout: GridItem[];
} {
  const widgets: DashWidget[] = [];
  const layout: GridItem[] = [];

  // KPI cards — 3/12 span each (4 per row), 120px tall
  config.kpis.slice(0, 4).forEach((field) => {
    const id = `kpi-${field}`;
    widgets.push({
      id,
      type: "kpi",
      field,
      label: `Total ${field}`,
      metric: "sum",
    });
    layout.push({ i: id, span: 3, height: 120 });
  });

  // Charts — 6/12 span (2-up), 280px tall
  config.charts.forEach((chart) => {
    const id = `chart-${chart.type}-${chart.x}-${chart.y}`;
    if (chart.type === "line") {
      widgets.push({
        id,
        type: "line",
        x: chart.x,
        y: chart.y,
        label: chart.label,
        metric: "sum",
      });
    } else if (chart.type === "pie") {
      widgets.push({
        id,
        type: "pie",
        category: chart.x,
        value: chart.y,
        label: chart.label,
        metric: "sum",
      });
    } else {
      widgets.push({
        id,
        type: "bar",
        x: chart.x,
        y: chart.y,
        label: chart.label,
        metric: "sum",
      });
    }
    layout.push({ i: id, span: 6, height: 280 });
  });

  // Table — full width, 320px tall
  if (config.showTable) {
    const id = "table-main";
    widgets.push({ id, type: "table" });
    layout.push({ i: id, span: 12, height: 320 });
  }

  return { widgets, layout };
}
