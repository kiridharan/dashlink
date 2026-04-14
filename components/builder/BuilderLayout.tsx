"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/project-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import {
  applyDashboardFilters,
  formatDashboardFilterLabel,
  getDatasetFields,
  getFieldValueOptions,
} from "@/lib/dashlink/filters";
import GridCanvas from "./GridCanvas";
import FieldPanel from "./FieldPanel";
import ThemeSelector from "./ThemeSelector";

interface Props {
  projectId: string;
}

function createFilterId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function BuilderLayout({ projectId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    projects,
    updateName,
    reorderWidgets,
    resizeWidget,
    addWidget,
    removeWidget,
    updateWidget,
    updateTheme,
    addFilter,
    removeFilter,
    clearFilters,
  } = useProjectStore();

  const project = projects.find((p) => p.id === projectId);
  const sourceData = project?.data ?? [];
  const activeFilters = project?.filters ?? [];

  const [title, setTitle] = useState(project?.name ?? "");
  const [shareCopied, setShareCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState("");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filterFields = useMemo(
    () => getDatasetFields(sourceData),
    [sourceData],
  );
  const valueOptions = useMemo(
    () =>
      selectedFilterField
        ? getFieldValueOptions(sourceData, selectedFilterField)
        : [],
    [sourceData, selectedFilterField],
  );
  const filteredData = useMemo(
    () => applyDashboardFilters(sourceData, activeFilters),
    [sourceData, activeFilters],
  );

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    if (user && !project) router.replace("/dashboard");
  }, [user, project, router]);

  useEffect(() => {
    setTitle(project?.name ?? "");
  }, [project?.name]);

  useEffect(() => {
    if (filterFields.length === 0) {
      setSelectedFilterField("");
      setSelectedFilterValue("");
      return;
    }

    if (!selectedFilterField || !filterFields.includes(selectedFilterField)) {
      setSelectedFilterField(filterFields[0]);
    }
  }, [filterFields, selectedFilterField]);

  useEffect(() => {
    if (valueOptions.length === 0) {
      setSelectedFilterValue("");
      return;
    }

    if (!valueOptions.includes(selectedFilterValue)) {
      setSelectedFilterValue(valueOptions[0]);
    }
  }, [selectedFilterValue, valueOptions]);

  if (!user || !project) return null;

  const hasFilters = activeFilters.length > 0;

  const handleTitleSave = () => {
    updateName(projectId, title.trim() || "Untitled Dashboard");
    setEditingTitle(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/view/${projectId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const handleReorder = (newWidgets: DashWidget[], newLayout: GridItem[]) => {
    reorderWidgets(projectId, newWidgets, newLayout);
  };

  const handleResizeWidget = (widgetId: string, height: number) => {
    resizeWidget(projectId, widgetId, height);
  };

  const handleAddWidget = (widget: DashWidget, gridItem: GridItem) => {
    addWidget(projectId, widget, gridItem);
  };

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(projectId, widgetId);
  };

  const handleUpdateWidget = (widgetId: string, patch: Partial<DashWidget>) => {
    updateWidget(projectId, widgetId, patch);
  };

  const handleAddValueFilter = () => {
    if (!selectedFilterField || !selectedFilterValue) return;

    addFilter(projectId, {
      id: createFilterId(),
      type: "value",
      field: selectedFilterField,
      value: selectedFilterValue,
    });
  };

  const handleAddSearchFilter = () => {
    const query = searchQuery.trim();
    if (!query) return;

    addFilter(projectId, {
      id: createFilterId(),
      type: "search",
      query,
    });
    setSearchQuery("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-700"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Dashboards
          </Link>

          <span className="text-zinc-200">/</span>

          {editingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="rounded border border-zinc-300 px-2 py-0.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-500"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex items-center gap-1.5 rounded px-1 py-0.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              {project.name}
              <svg
                width="11"
                height="11"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className="text-zinc-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <ThemeSelector
              currentThemeId={project.theme ?? "zinc"}
              onSelect={(themeId) => updateTheme(projectId, themeId)}
            />
            {project.widgets.length > 0 && (
              <Link
                href={`/view/${projectId}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400"
              >
                Preview ↗
              </Link>
            )}
            <button
              onClick={handleShare}
              disabled={project.widgets.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {shareCopied ? (
                <>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-100 px-5 py-2.5">
          <p
            className="truncate font-mono text-xs text-zinc-400"
            title={project.apiUrl}
          >
            {project.apiUrl ? (
              project.apiUrl.replace(/^https?:\/\//, "")
            ) : (
              <span className="italic">No data source configured</span>
            )}
          </p>
          {project.authConfig?.type && project.authConfig.type !== "none" && (
            <span className="mt-1 inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {project.authConfig.type === "bearer"
                ? "Bearer"
                : project.authConfig.type === "apikey"
                  ? "API Key"
                  : "Basic Auth"}
            </span>
          )}
        </div>

        {sourceData.length > 0 && (
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Filters
              </span>
              <select
                value={selectedFilterField}
                onChange={(e) => setSelectedFilterField(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400"
              >
                {filterFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              <select
                value={selectedFilterValue}
                onChange={(e) => setSelectedFilterValue(e.target.value)}
                disabled={valueOptions.length === 0}
                className="min-w-32 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {valueOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddValueFilter}
                disabled={!selectedFilterField || !selectedFilterValue}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add value filter
              </button>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSearchFilter();
                }}
                placeholder="Search all fields..."
                className="min-w-44 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
              <button
                onClick={handleAddSearchFilter}
                disabled={!searchQuery.trim()}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add search
              </button>
              {hasFilters && (
                <button
                  onClick={() => clearFilters(projectId)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
                >
                  Clear all
                </button>
              )}
              <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                {filteredData.length} / {sourceData.length} rows
              </span>
            </div>

            {hasFilters && (
              <div className="mt-2 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter.id}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600"
                  >
                    {formatDashboardFilterLabel(filter)}
                    <button
                      onClick={() => removeFilter(projectId, filter.id)}
                      className="rounded-full text-zinc-400 transition hover:text-zinc-700"
                      aria-label={`Remove ${formatDashboardFilterLabel(filter)}`}
                    >
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 gap-5 p-5">
        <FieldPanel
          data={project.data}
          apiUrl={project.apiUrl}
          authType={project.authConfig?.type}
          existingWidgetIds={new Set(project.widgets.map((w) => w.id))}
          onAdd={handleAddWidget}
        />

        <div className="flex-1 overflow-auto">
          <GridCanvas
            widgets={project.widgets}
            layout={project.layout}
            data={filteredData}
            themeId={project.theme}
            onReorder={handleReorder}
            onRemoveWidget={handleRemoveWidget}
            onResizeWidget={handleResizeWidget}
            onUpdateWidget={handleUpdateWidget}
          />
        </div>
      </div>
    </div>
  );
}
