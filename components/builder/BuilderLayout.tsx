"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  FilterControl,
  FilterControlType,
  FilterState,
  FilterValue,
  DashWidget,
  GridItem,
} from "@/lib/dashlink/builder-types";
import {
  applyFilterControls,
  controlLabel,
  getCategoricalFields,
  getDatasetFields,
  getDateFields,
  getNumericFields,
} from "@/lib/dashlink/filters";
import type { DashboardProject } from "@/lib/supabase/types";
import GridCanvas from "./GridCanvas";
import FieldPanel from "./FieldPanel";
import AiGeneratePanel, {
  type AiDashboardSpec,
  type AiDashboardModification,
} from "./AiGeneratePanel";
import ThemeSelector from "./ThemeSelector";
import FilterBar from "@/components/dashlink/FilterBar";

interface Props {
  initialProject: DashboardProject;
  /** DB-backed feature flag: whether this user can use the AI generator */
  aiEnabled?: boolean;
}

function createFilterId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function projectToPayload(project: DashboardProject) {
  return {
    name: project.name,
    apiUrl: project.apiUrl,
    authConfig: project.authConfig,
    dataPath: project.dataPath,
    config: project.config,
    widgets: project.widgets,
    layout: project.layout,
    data: project.data,
    theme: project.theme,
    filters: project.filters,
    isPublic: project.isPublic,
    refreshEnabled: project.refreshEnabled,
    refreshIntervalMinutes: project.refreshIntervalMinutes,
  };
}

export default function BuilderLayout({ initialProject, aiEnabled }: Props) {
  const [project, setProject] = useState(initialProject);
  const sourceData = project.data;
  const filterControls = project.filters;

  const [title, setTitle] = useState(initialProject.name);
  const [shareCopied, setShareCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [previewFilterState, setPreviewFilterState] = useState<FilterState>({});
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiApplying, setAiApplying] = useState(false);
  const [aiAnimatingIds, setAiAnimatingIds] = useState<Set<string>>(new Set());
  const [aiPendingItems, setAiPendingItems] = useState<GridItem[]>([]);
  const [aiRemovingIds, setAiRemovingIds] = useState<Set<string>>(new Set());
  const [aiProgress, setAiProgress] = useState({ placed: 0, total: 0 });
  const aiTimersRef = useRef<number[]>([]);
  const hasMountedRef = useRef(false);
  const lastSavedRef = useRef(JSON.stringify(projectToPayload(initialProject)));
  const saveTimerRef = useRef<number | null>(null);
  const saveControllerRef = useRef<AbortController | null>(null);

  const allFields = useMemo(() => getDatasetFields(sourceData), [sourceData]);
  const dateFields = useMemo(() => getDateFields(sourceData), [sourceData]);
  const numericFields = useMemo(
    () => getNumericFields(sourceData),
    [sourceData],
  );
  const categoricalFields = useMemo(
    () => getCategoricalFields(sourceData),
    [sourceData],
  );
  const filteredData = useMemo(
    () => applyFilterControls(sourceData, filterControls, previewFilterState),
    [sourceData, filterControls, previewFilterState],
  );
  const serializedProject = useMemo(
    () => JSON.stringify(projectToPayload(project)),
    [project],
  );
  const serializedProjectRef = useRef(serializedProject);
  serializedProjectRef.current = serializedProject;

  useEffect(() => {
    setTitle(project.name);
  }, [project.name]);

  const performSave = async (
    payload: string,
    options: { versionSummary?: string } = {},
  ) => {
    saveControllerRef.current?.abort();
    const controller = new AbortController();
    saveControllerRef.current = controller;

    setSaveState("saving");
    setSaveError(null);

    try {
      const body = options.versionSummary
        ? JSON.stringify({
            ...JSON.parse(payload),
            versionSummary: options.versionSummary,
          })
        : payload;

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Could not save dashboard.");
      }

      const nextProject = json.project as DashboardProject;
      lastSavedRef.current = JSON.stringify(projectToPayload(nextProject));
      // Only adopt the server copy if local state hasn't changed since this
      // save was sent — otherwise we'd wipe edits made while the request was
      // in flight (e.g. AI widgets placed during the staggered animation).
      if (serializedProjectRef.current === payload) {
        setProject(nextProject);
        setSaveState("saved");
      } else {
        setSaveState("dirty");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSaveState("error");
      setSaveError(
        error instanceof Error ? error.message : "Could not save dashboard.",
      );
    }
  };

  // Debounced autosave: 30 seconds of inactivity.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (serializedProject === lastSavedRef.current) {
      return;
    }

    setSaveState("dirty");

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void performSave(serializedProject);
    }, 30_000);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, serializedProject]);

  const handleManualSave = async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await performSave(serializedProject, { versionSummary: "Manual save" });
  };

  const saveImmediately = async (
    nextProject: DashboardProject,
    options: { versionSummary?: string } = {},
  ) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const payload = JSON.stringify(projectToPayload(nextProject));
    await performSave(payload, options);
  };

  const handleTogglePublish = async () => {
    const next = { ...project, isPublic: !project.isPublic };
    setProject(next);
    await saveImmediately(next, {
      versionSummary: next.isPublic ? "Published" : "Unpublished",
    });
  };

  const handleOpenPreview = async () => {
    if (!project.isPublic || project.widgets.length === 0) return;
    // Open the tab synchronously so popup blockers don't fire, then save.
    const win = window.open("about:blank", "_blank");
    if (serializedProject !== lastSavedRef.current) {
      await saveImmediately(project, { versionSummary: "Preview" });
    }
    const url = `${window.location.origin}/view/${project.publicSlug}`;
    if (win) win.location.href = url;
    else window.open(url, "_blank");
  };

  // Warn before navigating away with unsaved changes.
  useEffect(() => {
    const isDirty = serializedProject !== lastSavedRef.current;
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [serializedProject]);

  const hasFilterControls = filterControls.length > 0;

  const updateProject = (
    updater: (current: DashboardProject) => DashboardProject,
  ) => {
    setProject((current) => updater(current));
  };

  const handleTitleSave = () => {
    updateProject((current) => ({
      ...current,
      name: title.trim() || "Untitled Dashboard",
    }));
    setEditingTitle(false);
  };

  const handleShare = () => {
    if (!project.isPublic) return;

    const url = `${window.location.origin}/view/${project.publicSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const handleReorder = (newWidgets: DashWidget[], newLayout: GridItem[]) => {
    updateProject((current) => ({
      ...current,
      widgets: newWidgets,
      layout: newLayout,
    }));
  };

  const handleResizeWidget = (widgetId: string, height: number) => {
    updateProject((current) => ({
      ...current,
      layout: current.layout.map((item) =>
        item.i === widgetId ? { ...item, height } : item,
      ),
    }));
  };

  const handleAddWidget = (widget: DashWidget, gridItem: GridItem) => {
    updateProject((current) => ({
      ...current,
      widgets: [...current.widgets, widget],
      layout: [...current.layout, gridItem],
    }));
  };

  const handleRemoveWidget = (widgetId: string) => {
    updateProject((current) => ({
      ...current,
      widgets: current.widgets.filter((widget) => widget.id !== widgetId),
      layout: current.layout.filter((item) => item.i !== widgetId),
    }));
  };

  const handleUpdateWidget = (widgetId: string, patch: Partial<DashWidget>) => {
    updateProject((current) => ({
      ...current,
      widgets: current.widgets.map((widget) =>
        widget.id === widgetId
          ? ({ ...widget, ...patch } as DashWidget)
          : widget,
      ),
    }));
  };

  const addFilterControl = (control: FilterControl) => {
    updateProject((current) => ({
      ...current,
      filters: [...current.filters, control],
    }));
  };

  const removeFilterControl = (controlId: string) => {
    updateProject((current) => ({
      ...current,
      filters: current.filters.filter((c) => c.id !== controlId),
    }));
    setPreviewFilterState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [controlId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateFilterControl = (
    controlId: string,
    patch: Partial<FilterControl>,
  ) => {
    updateProject((current) => ({
      ...current,
      filters: current.filters.map((c) =>
        c.id === controlId ? ({ ...c, ...patch } as FilterControl) : c,
      ),
    }));
  };

  const clearFilterControls = () => {
    updateProject((current) => ({ ...current, filters: [] }));
    setPreviewFilterState({});
  };

  const handlePreviewChange = (controlId: string, value: FilterValue) => {
    setPreviewFilterState((prev) => ({ ...prev, [controlId]: value }));
  };

  // Replace the canvas with an AI-generated dashboard, placing widgets one by
  // one so the dashboard visibly "builds itself".
  const handleApplyAiDashboard = (spec: AiDashboardSpec) => {
    aiTimersRef.current.forEach((t) => window.clearTimeout(t));
    aiTimersRef.current = [];
    setAiApplying(true);
    setAiAnimatingIds(new Set(spec.widgets.map((w) => w.id)));
    setAiPendingItems(spec.layout);
    setAiProgress({ placed: 0, total: spec.widgets.length });

    if (spec.mode === "add") {
      // Keep the canvas; only merge in filters that don't duplicate an
      // existing control on the same field.
      updateProject((current) => {
        const existing = new Set(
          current.filters.map(
            (f) => `${f.type}:${"field" in f ? f.field : ""}`,
          ),
        );
        const newFilters = spec.filters.filter(
          (f) => !existing.has(`${f.type}:${"field" in f ? f.field : ""}`),
        );
        return { ...current, filters: [...current.filters, ...newFilters] };
      });
    } else {
      setPreviewFilterState({});
      updateProject((current) => ({
        ...current,
        name: spec.name || current.name,
        widgets: [],
        layout: [],
        filters: spec.filters,
      }));
    }

    const STEP_MS = 320;
    spec.widgets.forEach((widget, idx) => {
      const timer = window.setTimeout(() => {
        updateProject((current) => ({
          ...current,
          widgets: [...current.widgets, widget],
          layout: [...current.layout, spec.layout[idx]],
        }));
        setAiPendingItems((prev) => prev.slice(1));
        setAiProgress({ placed: idx + 1, total: spec.widgets.length });
      }, STEP_MS * (idx + 1));
      aiTimersRef.current.push(timer);
    });

    const doneTimer = window.setTimeout(
      () => {
        setAiApplying(false);
        setAiAnimatingIds(new Set());
        setAiPendingItems([]);
      },
      STEP_MS * (spec.widgets.length + 1) + 600,
    );
    aiTimersRef.current.push(doneTimer);
  };

  // Apply AI edits immediately (with a pop flash) and removals after a short
  // pop-out animation. Removals were already confirmed by the user in chat.
  const handleAiModify = (mod: AiDashboardModification) => {
    if (mod.edits.length > 0) {
      updateProject((current) => ({
        ...current,
        widgets: current.widgets.map((w) => {
          const edit = mod.edits.find((e) => e.id === w.id);
          return edit ? ({ ...w, ...edit.patch } as DashWidget) : w;
        }),
        layout: current.layout.map((item) => {
          const edit = mod.edits.find((e) => e.id === item.i);
          return edit?.layoutPatch ? { ...item, ...edit.layoutPatch } : item;
        }),
      }));
      setAiAnimatingIds(new Set(mod.edits.map((e) => e.id)));
      const flashTimer = window.setTimeout(
        () => setAiAnimatingIds(new Set()),
        600,
      );
      aiTimersRef.current.push(flashTimer);
    }

    if (mod.remove.length > 0) {
      setAiRemovingIds(new Set(mod.remove));
      const removeTimer = window.setTimeout(() => {
        const gone = new Set(mod.remove);
        updateProject((current) => ({
          ...current,
          widgets: current.widgets.filter((w) => !gone.has(w.id)),
          layout: current.layout.filter((item) => !gone.has(item.i)),
        }));
        setAiRemovingIds(new Set());
      }, 380);
      aiTimersRef.current.push(removeTimer);
    }
  };

  useEffect(() => {
    return () => aiTimersRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const handleAddControlOfType = (type: FilterControlType) => {
    let field = "";
    if (type === "dateRange") field = dateFields[0] ?? allFields[0] ?? "";
    else if (type === "numberRange")
      field = numericFields[0] ?? allFields[0] ?? "";
    else if (type === "select" || type === "multiSelect")
      field = categoricalFields[0] ?? allFields[0] ?? "";

    const id = createFilterId();
    const base = { id, label: "" };

    if (type === "search") {
      addFilterControl({ ...base, type: "search" });
    } else {
      addFilterControl({ ...base, type, field } as FilterControl);
    }
    setShowAddFilter(false);
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
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${
                saveState === "error"
                  ? "bg-red-50 text-red-600"
                  : saveState === "dirty"
                    ? "bg-amber-50 text-amber-700"
                    : saveState === "saving"
                      ? "bg-zinc-100 text-zinc-600"
                      : saveState === "saved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
              }`}
              title={saveError ?? undefined}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "All changes saved"
                  : saveState === "dirty"
                    ? "Unsaved changes"
                    : saveState === "error"
                      ? "Save failed"
                      : "Ready"}
            </span>
            <button
              onClick={handleManualSave}
              disabled={
                saveState === "saving" ||
                serializedProject === lastSavedRef.current
              }
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
              title="Save now and create a version snapshot"
            >
              Save version
            </button>
            <ThemeSelector
              currentThemeId={project.theme ?? "zinc"}
              onSelect={(themeId) =>
                updateProject((current) => ({ ...current, theme: themeId }))
              }
            />
            <select
              value={
                project.refreshEnabled
                  ? String(project.refreshIntervalMinutes ?? 60)
                  : "off"
              }
              onChange={(e) => {
                const v = e.target.value;
                updateProject((current) => ({
                  ...current,
                  refreshEnabled: v !== "off",
                  refreshIntervalMinutes: v === "off" ? null : Number(v),
                }));
              }}
              className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
              title="Automatically re-fetch this dashboard's source API on a schedule"
            >
              <option value="off">Auto-refresh: Off</option>
              <option value="60">Every hour</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Daily</option>
            </select>
            <button
              onClick={handleTogglePublish}
              disabled={saveState === "saving"}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                project.isPublic
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              }`}
              title={
                project.isPublic
                  ? "Currently public — click to unpublish (saves automatically)"
                  : "Currently private — click to publish (saves automatically)"
              }
            >
              {project.isPublic ? "● Published" : "Publish"}
            </button>
            {project.widgets.length > 0 && (
              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={!project.isPublic || saveState === "saving"}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  project.isPublic
                    ? "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    : "border-zinc-100 text-zinc-300"
                }`}
                title="Save and open the public viewer in a new tab"
              >
                Preview ↗
              </button>
            )}
            <Link
              href={`/projects/${project.id}/history`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400"
              title="Time-travel & version history"
            >
              History
            </Link>
            <Link
              href={`/projects/${project.id}/alerts`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400"
              title="Scheduled alerts"
            >
              Alerts
            </Link>
            <button
              onClick={handleShare}
              disabled={project.widgets.length === 0 || !project.isPublic}
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
          {saveError && (
            <p className="mt-2 text-xs text-red-500">{saveError}</p>
          )}
        </div>

        {sourceData.length > 0 && (
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Viewer Filters
              </span>
              <p className="text-[11px] text-zinc-500">
                Define controls your audience sees on the published dashboard.
              </p>
              <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                {filteredData.length} / {sourceData.length} rows
              </span>
            </div>

            {hasFilterControls && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filterControls.map((control) => (
                  <FilterControlChip
                    key={control.id}
                    control={control}
                    fields={
                      control.type === "dateRange"
                        ? dateFields
                        : control.type === "numberRange"
                          ? numericFields
                          : control.type === "search"
                            ? []
                            : allFields
                    }
                    onRename={(label) =>
                      updateFilterControl(control.id, { label })
                    }
                    onChangeField={(field) =>
                      control.type !== "search"
                        ? updateFilterControl(control.id, {
                            field,
                          } as Partial<FilterControl>)
                        : undefined
                    }
                    onRemove={() => removeFilterControl(control.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddFilter((s) => !s)}
                  className="rounded-lg border border-dashed border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
                >
                  + Add filter control
                </button>
                {showAddFilter && (
                  <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
                    {(
                      [
                        { type: "select", label: "Dropdown (single)" },
                        { type: "multiSelect", label: "Multi-select" },
                        { type: "dateRange", label: "Date range" },
                        { type: "numberRange", label: "Number range" },
                        { type: "search", label: "Search box" },
                      ] as const
                    ).map((opt) => {
                      const disabled =
                        (opt.type === "dateRange" && dateFields.length === 0) ||
                        (opt.type === "numberRange" &&
                          numericFields.length === 0) ||
                        ((opt.type === "select" ||
                          opt.type === "multiSelect") &&
                          allFields.length === 0);
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleAddControlOfType(opt.type)}
                          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {opt.label}
                          {disabled && (
                            <span className="text-[10px] text-zinc-400">
                              n/a
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {hasFilterControls && (
                <button
                  type="button"
                  onClick={clearFilterControls}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
                >
                  Remove all
                </button>
              )}
            </div>

            {hasFilterControls && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Live preview
                </p>
                <FilterBar
                  controls={filterControls}
                  state={previewFilterState}
                  data={sourceData}
                  onChange={handlePreviewChange}
                  onClear={() => setPreviewFilterState({})}
                  variant="builder"
                />
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

        <div className="relative flex-1 overflow-auto">
          {aiApplying && (
            <div className="pointer-events-none sticky top-2 z-30 flex justify-center">
              <div className="flex items-center gap-2.5 rounded-full border border-indigo-200 bg-white/95 px-4 py-2 shadow-lg shadow-indigo-500/10 backdrop-blur">
                <span className="ai-build-spinner" aria-hidden />
                <span className="text-xs font-semibold text-zinc-800">
                  Building your dashboard…
                </span>
                <span className="tabular-nums text-xs text-zinc-400">
                  {aiProgress.placed}/{aiProgress.total}
                </span>
                <span className="h-1 w-24 overflow-hidden rounded-full bg-zinc-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                    style={{
                      width: `${
                        aiProgress.total
                          ? (aiProgress.placed / aiProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </span>
              </div>
              <style>{`
                .ai-build-spinner {
                  width: 14px;
                  height: 14px;
                  border-radius: 999px;
                  border: 2px solid #c7d2fe;
                  border-top-color: #6366f1;
                  animation: ai-build-spin 0.7s linear infinite;
                }
                @keyframes ai-build-spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
          <GridCanvas
            widgets={project.widgets}
            layout={project.layout}
            data={filteredData}
            themeId={project.theme}
            onReorder={handleReorder}
            onRemoveWidget={handleRemoveWidget}
            onResizeWidget={handleResizeWidget}
            onUpdateWidget={handleUpdateWidget}
            animatingIds={aiAnimatingIds}
            pendingItems={aiApplying ? aiPendingItems : undefined}
            removingIds={aiRemovingIds}
          />
        </div>
      </div>

      {aiEnabled && (
        <AiGeneratePanel
          data={sourceData}
          currentWidgets={project.widgets}
          onApply={handleApplyAiDashboard}
          onModify={handleAiModify}
          isApplying={aiApplying}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter control chip — inline editor for a single FilterControl
// ---------------------------------------------------------------------------

interface ChipProps {
  control: FilterControl;
  fields: string[];
  onRename: (label: string) => void;
  onChangeField: (field: string) => void;
  onRemove: () => void;
}

function FilterControlChip({
  control,
  fields,
  onRename,
  onChangeField,
  onRemove,
}: ChipProps) {
  const typeLabel: Record<FilterControlType, string> = {
    select: "Dropdown",
    multiSelect: "Multi-select",
    dateRange: "Date range",
    numberRange: "Number range",
    search: "Search",
  };

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs">
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {typeLabel[control.type]}
      </span>
      {control.type !== "search" && fields.length > 0 && (
        <select
          value={(control as { field: string }).field}
          onChange={(e) => onChangeField(e.target.value)}
          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
        >
          {fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      )}
      <input
        value={control.label ?? ""}
        onChange={(e) => onRename(e.target.value)}
        placeholder={controlLabel(control)}
        className="w-28 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-zinc-800 outline-none focus:border-zinc-300 focus:bg-white"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter control"
        className="rounded text-zinc-400 transition hover:text-zinc-700"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
