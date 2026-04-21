import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectById, listProjectVersions } from "@/lib/supabase/queries";
import HistoryClient from "./HistoryClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HistoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}/history`);
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

  const versions = await listProjectVersions(supabase, id);

  return (
    <HistoryClient
      projectId={id}
      projectName={project.name}
      versions={versions}
    />
  );
}
