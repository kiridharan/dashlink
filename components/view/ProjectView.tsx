"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/project-store";
import { getTheme } from "@/lib/dashlink/themes";
import WidgetGrid from "./WidgetGrid";

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

  if (!project || project.widgets.length === 0) {
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

  const theme = getTheme(project.theme);

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          background: theme.headerBg,
          borderColor: theme.headerBorderColor,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:opacity-70"
            style={{ color: theme.titleColor }}
          >
            ← Dashboards
          </Link>
          <span
            className="truncate font-mono text-xs"
            style={{ color: theme.mutedColor }}
            title={project.apiUrl}
          >
            {project.apiUrl?.replace(/^https?:\/\//, "") ?? ""}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1
          className="mb-6 text-2xl font-bold tracking-tight"
          style={{ color: theme.titleColor }}
        >
          {project.name}
        </h1>
        <WidgetGrid
          widgets={project.widgets}
          layout={project.layout}
          data={project.data}
          themeId={project.theme}
        />
      </main>
    </div>
  );
}
