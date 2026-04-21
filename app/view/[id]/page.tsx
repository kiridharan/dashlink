import { DEMO_DASHBOARDS } from "@/lib/dashlink/dummy-data";
import DashboardView from "@/components/dashlink/DashboardView";
import ProjectView from "@/components/view/ProjectView";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPublicProjectBySlug } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ desktop?: string }>;
}

function isMobileUserAgent(ua: string): boolean {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
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

export default async function ViewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const search = (await searchParams) ?? {};

  // Auto-redirect mobile user agents to the mobile-first viewer
  // (skippable via ?desktop=1).
  if (search.desktop !== "1") {
    const ua = (await headers()).get("user-agent") ?? "";
    if (isMobileUserAgent(ua)) {
      redirect(`/view/${id}/mobile`);
    }
  }

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
