"use client";

import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { ThemeProvider } from "@/lib/dashlink/theme-context";
import { getTheme } from "@/lib/dashlink/themes";
import KpiWidgetCard from "@/components/builder/widgets/KpiWidgetCard";
import LineWidgetChart from "@/components/builder/widgets/LineWidgetChart";
import BarWidgetChart from "@/components/builder/widgets/BarWidgetChart";
import PieWidgetChart from "@/components/builder/widgets/PieWidgetChart";
import TableWidgetView from "@/components/builder/widgets/TableWidgetView";

// Span → Tailwind class (same map as GridCanvas)
const SPAN_CLASS: Record<number, string> = {
  3: "col-span-3",
  4: "col-span-4",
  6: "col-span-6",
  12: "col-span-12",
};
function spanClass(span: number) {
  return SPAN_CLASS[span] ?? "col-span-6";
}

function WidgetContent({
  widget,
  data,
}: {
  widget: DashWidget;
  data: Dataset;
}) {
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

interface Props {
  widgets: DashWidget[];
  layout: GridItem[];
  data: Dataset;
  themeId?: string;
}

export default function WidgetGrid({ widgets, layout, data, themeId }: Props) {
  const theme = getTheme(themeId);

  if (!widgets.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center"
        style={{ borderColor: theme.cardBorderColor, background: theme.pageBg }}
      >
        <p style={{ color: theme.mutedColor }}>No widgets configured yet.</p>
      </div>
    );
  }

  return (
    <ThemeProvider themeId={themeId}>
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => {
          const item = layout.find((l) => l.i === widget.id);
          if (!item) return null;
          return (
            <div
              key={widget.id}
              className={spanClass(item.span)}
              style={{ height: item.height }}
            >
              <div
                className="h-full overflow-hidden border"
                style={{
                  background: theme.cardBg,
                  borderColor: theme.cardBorderColor,
                  borderRadius: theme.chart.cardRadius,
                  boxShadow: theme.chart.cardShadow,
                }}
              >
                <WidgetContent widget={widget} data={data} />
              </div>
            </div>
          );
        })}
      </div>
    </ThemeProvider>
  );
}
