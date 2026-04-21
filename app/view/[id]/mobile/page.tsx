import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { DEMO_DASHBOARDS } from "@/lib/dashlink/dummy-data";
import { configToWidgets } from "@/lib/dashlink/builder-types";
import MobileView from "@/components/view/MobileView";

export const metadata = {
  title: "DashLink",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MobileViewPage({ params }: Props) {
  const { id } = await params;

  // Demo dashboard support
  const demo = DEMO_DASHBOARDS[id];
  if (demo) {
    const { widgets, layout } = configToWidgets(demo.config);
    return (
      <MobileView
        projectName={demo.config.title}
        apiUrl={demo.config.apiUrl}
        widgets={widgets}
        layout={layout}
        data={demo.data}
        themeId="zinc"
        publicSlug={id}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const project = await getPublicProjectBySlug(supabase, id);
  if (!project) notFound();

  return (
    <MobileView
      projectName={project.name}
      apiUrl={project.apiUrl}
      widgets={project.widgets}
      layout={project.layout}
      data={project.data}
      themeId={project.theme}
      publicSlug={project.publicSlug}
    />
  );
}
