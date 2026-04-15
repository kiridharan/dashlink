"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/projects/ProjectCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DashboardProject } from "@/lib/supabase/types";

interface Props {
  initialProjects: DashboardProject[];
  userLabel: string;
}

export default function DashboardPageClient({
  initialProjects,
  userLabel,
}: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
      setSigningOut(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = projects;
    setProjects((current) => current.filter((project) => project.id !== id));
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error ?? "Could not delete dashboard.");
      }
    } catch (err) {
      setProjects(previous);
      setError(
        err instanceof Error ? err.message : "Could not delete dashboard.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-zinc-900"
          >
            Dash<span className="text-zinc-400">Link</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{userLabel}</span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-zinc-400 transition hover:text-zinc-700 disabled:opacity-40"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Dashboards
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New dashboard
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                isDeleting={deletingId === project.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-24 text-center">
            <div className="mb-4 rounded-full bg-zinc-100 p-4">
              <svg
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-zinc-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-700">
              No dashboards yet
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Paste an API URL and generate your first live dashboard.
            </p>
            <Link
              href="/projects/new"
              className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Create your first dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
