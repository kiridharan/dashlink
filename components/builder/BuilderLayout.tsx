"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore, type Project } from "@/lib/store/project-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { detectSchema } from "@/lib/dashlink/schema-detection";
import { DEMO_SALES_DATA } from "@/lib/dashlink/dummy-data";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import GridCanvas from "./GridCanvas";
import WidgetPalette from "./WidgetPalette";

interface Props {
  projectId: string;
}

export default function BuilderLayout({ projectId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    projects,
    updateApiUrl,
    updateName,
    applyConfig,
    saveLayout,
    addWidget,
    removeWidget,
  } = useProjectStore();

  const project = projects.find((p) => p.id === projectId);

  const [apiUrl, setApiUrl] = useState(project?.apiUrl ?? "");
  const [title, setTitle] = useState(project?.name ?? "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  // Redirect if not authed
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  // Redirect if project not found (deleted)
  useEffect(() => {
    if (user && !project) router.replace("/dashboard");
  }, [user, project, router]);

  if (!user || !project) return null;

  // ---- Handlers ----

  const handleGenerate = async () => {
    if (!apiUrl.trim()) return;
    setGenError(null);
    setGenerating(true);

    try {
      new URL(apiUrl);
    } catch {
      setGenError("Please enter a valid URL.");
      setGenerating(false);
      return;
    }

    // Persist the URL
    updateApiUrl(projectId, apiUrl.trim());

    // UI-only: use demo data + schema detection
    await new Promise((r) => setTimeout(r, 600)); // simulate network

    const config = detectSchema(DEMO_SALES_DATA, apiUrl.trim());
    applyConfig(projectId, config, DEMO_SALES_DATA);
    setGenerating(false);
  };

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

  const handleLayoutChange = (newLayout: GridItem[]) => {
    saveLayout(projectId, newLayout);
  };

  const handleAddWidget = (widget: DashWidget, gridItem: GridItem) => {
    addWidget(projectId, widget, gridItem);
  };

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(projectId, widgetId);
  };

  // Compute bottom-most y position for stacking new widgets
  const nextY = project.layout.reduce((max, l) => Math.max(max, l.y + l.h), 0);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* ---- Top nav ---- */}
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

          {/* Editable title */}
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

        {/* ---- URL generate bar ---- */}
        <div className="border-t border-zinc-100 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition focus-within:border-zinc-400 focus-within:bg-white">
              <span className="px-3 text-xs text-zinc-400 select-none">
                GET
              </span>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="https://api.example.com/v1/data"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !apiUrl.trim()}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {generating ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Generate →"
              )}
            </button>
          </div>
          {genError && (
            <p className="mt-1.5 text-xs text-red-500">{genError}</p>
          )}
        </div>
      </header>

      {/* ---- Builder body ---- */}
      <div className="flex flex-1 gap-5 p-5">
        <WidgetPalette
          data={project.data}
          existingWidgetIds={new Set(project.widgets.map((w) => w.id))}
          onAdd={handleAddWidget}
          nextY={nextY}
        />

        <div className="flex-1 overflow-auto">
          <GridCanvas
            widgets={project.widgets}
            layout={project.layout}
            data={project.data}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={handleRemoveWidget}
          />
        </div>
      </div>
    </div>
  );
}
