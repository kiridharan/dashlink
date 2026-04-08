"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/project-store";
import DashboardRenderer from "@/components/dashlink/DashboardRenderer";

interface Props {
  projectId: string;
}

export default function ProjectView({ projectId }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const { projects } = useProjectStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);

  if (!project || !project.config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-center">
        <p className="text-base font-semibold text-zinc-700">
          Dashboard not found
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          This dashboard may be private or hasn&apos;t been generated yet.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Go to DashLink
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 hover:text-zinc-600"
          >
            ← DashLink
          </Link>
          <span className="text-xs text-zinc-400 font-mono">
            {project.apiUrl}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
          {project.name}
        </h1>
        <DashboardRenderer config={project.config} data={project.data} />
      </main>
    </div>
  );
}
