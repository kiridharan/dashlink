import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { getTheme } from "@/lib/dashlink/themes";
import { ThemeProvider } from "@/lib/dashlink/theme-context";
import { renderWidget } from "@/lib/dashlink/render-widget";

interface Props {
  params: Promise<{ slug: string; widgetId: string }>;
}

export const metadata = {
  title: "DashLink Widget",
  robots: { index: false, follow: false },
};

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
