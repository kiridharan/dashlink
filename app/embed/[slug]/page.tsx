import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { getTheme } from "@/lib/dashlink/themes";
import WidgetGrid from "@/components/view/WidgetGrid";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: "DashLink Embed",
  // Embed pages should not be indexed.
  robots: { index: false, follow: false },
};

export default async function EmbedDashboardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const project = await getPublicProjectBySlug(supabase, slug);

  if (!project) notFound();

  const theme = getTheme(project.theme);

  return (
    <div className="min-h-screen p-4" style={{ background: theme.pageBg }}>
      <WidgetGrid
        widgets={project.widgets}
        layout={project.layout}
        data={project.data}
        themeId={project.theme}
      />
    </div>
  );
}
