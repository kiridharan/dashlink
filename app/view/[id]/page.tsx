import { DEMO_DASHBOARDS } from "@/lib/dashlink/dummy-data";
import DashboardView from "@/components/dashlink/DashboardView";
import ProjectView from "@/components/view/ProjectView";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const demo = DEMO_DASHBOARDS[id];
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

  // 2. User project from client-side Zustand store
  return <ProjectView projectId={id} />;
}
