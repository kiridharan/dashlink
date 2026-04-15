import { DEMO_DASHBOARDS } from "@/lib/dashlink/dummy-data";
import DashboardView from "@/components/dashlink/DashboardView";
import ProjectView from "@/components/view/ProjectView";
import { notFound } from "next/navigation";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const demo = DEMO_DASHBOARDS[id];

  if (!demo) {
    const supabase = await createSupabaseServerClient();
    const project = await getPublicProjectBySlug(supabase, id);

    if (project) {
      return {
        title: `${project.name} — DashLink`,
      };
    }
  }

  return {
    title: demo ? `${demo.config.title} — DashLink` : "Dashboard — DashLink",
  };
}

export default async function ViewPage({ params }: Props) {
  const { id } = await params;

  // 1. Pre-built demo dashboards (server-side)
  const demo = DEMO_DASHBOARDS[id];
  if (demo) {
    return <DashboardView config={demo.config} data={demo.data} />;
  }

  const supabase = await createSupabaseServerClient();
  const project = await getPublicProjectBySlug(supabase, id);

  if (!project) {
    notFound();
  }

  return <ProjectView project={project} />;
}
