import type { ReactElement } from "react";
import type { DashWidget } from "./builder-types";
import type { Dataset } from "./types";
import KpiWidgetCard from "@/components/builder/widgets/KpiWidgetCard";
import LineWidgetChart from "@/components/builder/widgets/LineWidgetChart";
import BarWidgetChart from "@/components/builder/widgets/BarWidgetChart";
import PieWidgetChart from "@/components/builder/widgets/PieWidgetChart";
import TableWidgetView from "@/components/builder/widgets/TableWidgetView";

/**
 * Single source of truth for mapping a widget to its display component.
 *
 * Shared by the builder canvas, the public viewer grid, and the embed pages so
 * that adding a new `WidgetType` only requires touching one switch. Pure render
 * (no hooks) — safe to call from both server and client components.
 */
export function renderWidget(widget: DashWidget, data: Dataset): ReactElement {
  switch (widget.type) {
    case "kpi":
      return <KpiWidgetCard widget={widget} data={data} />;
    case "line":
      return <LineWidgetChart widget={widget} data={data} />;
    case "bar":
      return <BarWidgetChart widget={widget} data={data} />;
    case "pie":
      return <PieWidgetChart widget={widget} data={data} />;
    case "table":
      return <TableWidgetView widget={widget} data={data} />;
  }
}
