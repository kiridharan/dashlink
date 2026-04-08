// Widget types used by the drag-and-drop dashboard builder

export type WidgetType = "kpi" | "line" | "bar" | "table";

// ---- Size descriptor ----
// `span`  : how many of 12 virtual columns the widget occupies
// `height`: pixel height — user-resizable
export interface GridItem {
  i: string;       // widget id
  span: number;    // 1–12 column span
  height: number;  // px height
}

// ---- Widget configs ----
export interface KpiWidget {
  id: string;
  type: "kpi";
  field: string;
  label: string;
}

export interface LineWidget {
  id: string;
  type: "line";
  x: string;
  y: string;
  label: string;
}

export interface BarWidget {
  id: string;
  type: "bar";
  x: string;
  y: string;
  label: string;
}

export interface TableWidget {
  id: string;
  type: "table";
  columns?: string[];
}

export type DashWidget = KpiWidget | LineWidget | BarWidget | TableWidget;

// ---- Conversion helper: DashboardConfig → initial widgets + layout ----
import type { DashboardConfig } from "./types";

export function configToWidgets(
  config: DashboardConfig
): { widgets: DashWidget[]; layout: GridItem[] } {
  const widgets: DashWidget[] = [];
  const layout: GridItem[] = [];

  // KPI cards — 3/12 span each (4 per row), 120px tall
  config.kpis.slice(0, 4).forEach((field) => {
    const id = `kpi-${field}`;
    widgets.push({ id, type: "kpi", field, label: `Total ${field}` });
    layout.push({ i: id, span: 3, height: 120 });
  });

  // Charts — 6/12 span (2-up), 280px tall
  config.charts.forEach((chart) => {
    const id = `chart-${chart.type}-${chart.x}-${chart.y}`;
    if (chart.type === "line") {
      widgets.push({ id, type: "line", x: chart.x, y: chart.y, label: chart.label });
    } else {
      widgets.push({ id, type: "bar", x: chart.x, y: chart.y, label: chart.label });
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
