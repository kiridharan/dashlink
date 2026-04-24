"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getTheme } from "@/lib/dashlink/themes";
import { applyFilterControls } from "@/lib/dashlink/filters";
import type { FilterState, FilterValue } from "@/lib/dashlink/builder-types";
import type { DashboardProject } from "@/lib/supabase/types";
import WidgetGrid from "./WidgetGrid";
import FilterBar from "@/components/dashlink/FilterBar";

interface Props {
  project: DashboardProject;
}

export default function ProjectView({ project }: Props) {
  const [filterState, setFilterState] = useState<FilterState>({});

  const filteredData = useMemo(
    () => applyFilterControls(project.data, project.filters, filterState),
    [project.data, project.filters, filterState],
  );

  const handleFilterChange = (controlId: string, value: FilterValue) => {
    setFilterState((prev) => ({ ...prev, [controlId]: value }));
  };

  if (project.widgets.length === 0) {
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
            href="/"
            className="text-sm font-semibold hover:opacity-70"
            style={{ color: theme.titleColor }}
          >
            ← DashLink
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

        {project.filters.length > 0 && (
          <div className="mb-6">
            <FilterBar
              controls={project.filters}
              state={filterState}
              data={project.data}
              onChange={handleFilterChange}
              onClear={() => setFilterState({})}
              variant="viewer"
              tokens={{
                cardBg: theme.cardBg,
                border: theme.cardBorderColor,
                text: theme.titleColor,
                muted: theme.mutedColor,
              }}
            />
          </div>
        )}

        <WidgetGrid
          widgets={project.widgets}
          layout={project.layout}
          data={filteredData}
          themeId={project.theme}
        />
      </main>
    </div>
  );
}
