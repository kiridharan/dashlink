import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import EmbedPreview from "@/components/embed/EmbedPreview";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmbedPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}/embed`);
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

  const h = await headers();
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = envUrl ?? (host ? `${proto}://${host}` : "");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}`}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              ← Back to builder
            </Link>
            <span className="text-zinc-300">/</span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Embed · {project.name}
            </h1>
          </div>
          <Link
            href={`/projects/${project.id}/alerts`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            Alerts →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Embed preview
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Preview your dashboard at any size, then copy a one-line snippet.
          </p>
        </div>
        <EmbedPreview project={project} origin={origin} />
      </main>
    </div>
  );
}
