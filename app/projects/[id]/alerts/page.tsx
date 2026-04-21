import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { listAlerts } from "@/lib/supabase/alerts";
import AlertsClient from "./AlertsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}/alerts`);
  }

  const project = await getProjectById(supabase, id);
  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <p className="text-base font-semibold text-zinc-700">
          Dashboard not found
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to dashboards
        </Link>
      </div>
    );
  }

  const alerts = await listAlerts(supabase, id);
  const kpiWidgets = project.widgets
    .filter((w) => w.type === "kpi")
    .map((w) => {
      // Narrow to KpiWidget shape for the client form.
      const kpi = w as Extract<typeof w, { type: "kpi" }>;
      return {
        id: kpi.id,
        label: kpi.label,
        field: kpi.field,
      };
    });

  return (
    <AlertsClient
      projectId={id}
      projectName={project.name}
      kpiWidgets={kpiWidgets}
      initialAlerts={alerts}
    />
  );
}
