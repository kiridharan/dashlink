import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { getTheme } from "@/lib/dashlink/themes";
import { ThemeProvider } from "@/lib/dashlink/theme-context";
import KpiWidgetCard from "@/components/builder/widgets/KpiWidgetCard";
import LineWidgetChart from "@/components/builder/widgets/LineWidgetChart";
import BarWidgetChart from "@/components/builder/widgets/BarWidgetChart";
import PieWidgetChart from "@/components/builder/widgets/PieWidgetChart";
import TableWidgetView from "@/components/builder/widgets/TableWidgetView";
import type { DashWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";

interface Props {
  params: Promise<{ slug: string; widgetId: string }>;
}

export const metadata = {
  title: "DashLink Widget",
  robots: { index: false, follow: false },
};

function renderWidget(widget: DashWidget, data: Dataset) {
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

export default async function EmbedWidgetPage({ params }: Props) {
  const { slug, widgetId } = await params;
  const supabase = await createSupabaseServerClient();
  const project = await getPublicProjectBySlug(supabase, slug);

  if (!project) notFound();

  const widget = project.widgets.find((w) => w.id === widgetId);
  if (!widget) notFound();

  const theme = getTheme(project.theme);

  return (
    <ThemeProvider themeId={project.theme}>
      <div className="min-h-screen p-2" style={{ background: theme.pageBg }}>
        <div
          className="h-full overflow-hidden border"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorderColor,
            borderRadius: theme.chart.cardRadius,
            boxShadow: theme.chart.cardShadow,
            minHeight: "calc(100vh - 1rem)",
          }}
        >
          {renderWidget(widget, project.data)}
        </div>
      </div>
    </ThemeProvider>
  );
}
