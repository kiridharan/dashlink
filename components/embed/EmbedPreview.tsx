"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardProject } from "@/lib/supabase/types";

interface Props {
  project: DashboardProject;
  origin: string;
}

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: Record<
  Device,
  { label: string; width: number | "100%"; icon: string }
> = {
  desktop: { label: "Desktop", width: "100%", icon: "🖥" },
  tablet: { label: "Tablet", width: 768, icon: "📱" },
  mobile: { label: "Mobile", width: 390, icon: "📱" },
};

export default function EmbedPreview({ project, origin }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [widgetId, setWidgetId] = useState<"all" | string>("all");
  const [height, setHeight] = useState(600);
  const [theme, setTheme] = useState<"inherit" | "light" | "dark">("inherit");
  const [copied, setCopied] = useState<string | null>(null);

  const isPublic = project.isPublic;
  const slug = project.publicSlug;

  const embedUrl = useMemo(() => {
    if (!slug) return "";
    const base = `${origin}/embed/${slug}`;
    const path = widgetId === "all" ? base : `${base}/${widgetId}`;
    const params = new URLSearchParams();
    if (theme !== "inherit") params.set("theme", theme);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }, [origin, slug, widgetId, theme]);

  const iframeSnippet = useMemo(() => {
    if (!embedUrl) return "";
    return `<iframe
  src="${embedUrl}"
  style="width:100%;height:${height}px;border:0;border-radius:12px;"
  loading="lazy"
  title="${escapeAttr(project.name)}"
  sandbox="allow-scripts allow-same-origin allow-popups"
></iframe>`;
  }, [embedUrl, height, project.name]);

  const sdkSnippet = useMemo(() => {
    return `<div data-dashlink="${slug}"${
      widgetId !== "all" ? ` data-widget="${widgetId}"` : ""
    } data-height="${height}"></div>
<script src="${origin}/embed.js" async></script>`;
  }, [origin, slug, widgetId, height]);

  const reactSnippet = useMemo(() => {
    return `export function DashLinkEmbed() {
  return (
    <iframe
      src="${embedUrl}"
      style={{ width: "100%", height: ${height}, border: 0, borderRadius: 12 }}
      loading="lazy"
      title=${JSON.stringify(project.name)}
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}`;
  }, [embedUrl, height, project.name]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  // Reset copied when switching tabs
  useEffect(() => setCopied(null), [device, widgetId, theme, height]);

  if (!isPublic) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-base font-semibold text-amber-900">
          Make this dashboard public to embed it
        </h2>
        <p className="mt-2 text-sm text-amber-800">
          Embeds load via the public share URL. Open the builder, toggle “Public
          link on”, and come back here to grab your snippet.
        </p>
        <Link
          href={`/projects/${project.id}`}
          className="mt-4 inline-flex items-center rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
        >
          Open builder
        </Link>
      </div>
    );
  }

  const previewWidth = DEVICES[device].width;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Preview pane */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            {(Object.keys(DEVICES) as Device[]).map((key) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  device === key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {DEVICES[key].label}
              </button>
            ))}
          </div>
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
          >
            Open raw
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 3h7v7m0-7L10 14M5 5h6v2H7v10h10v-4h2v6H5V5z"
              />
            </svg>
          </a>
        </div>

        <div className="flex justify-center rounded-xl bg-zinc-100 p-4">
          <div
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300"
            style={{
              width: previewWidth,
              maxWidth: "100%",
              height: height + 40,
            }}
          >
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`${project.name} preview`}
              style={{ width: "100%", height: "100%", border: 0 }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      </div>

      {/* Controls + snippets */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Configure</h3>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Content</span>
              <select
                value={widgetId}
                onChange={(e) => setWidgetId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
              >
                <option value="all">Full dashboard</option>
                {project.widgets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {widgetLabel(w)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-600">
                Height (px)
              </span>
              <input
                type="number"
                min={200}
                max={2000}
                step={20}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 600)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as typeof theme)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
              >
                <option value="inherit">Inherit</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
        </div>

        <SnippetCard
          title="HTML iframe"
          description="Drop into any HTML page, blog post, or CMS."
          code={iframeSnippet}
          copied={copied === "html"}
          onCopy={() => copy("html", iframeSnippet)}
        />
        <SnippetCard
          title="Auto-mount script"
          description="Loads via /embed.js — handy for multiple embeds on one page."
          code={sdkSnippet}
          copied={copied === "sdk"}
          onCopy={() => copy("sdk", sdkSnippet)}
        />
        <SnippetCard
          title="React component"
          description="Paste into your React/Next.js app."
          code={reactSnippet}
          copied={copied === "react"}
          onCopy={() => copy("react", reactSnippet)}
        />
      </div>
    </div>
  );
}

function SnippetCard({
  title,
  description,
  code,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <button
          onClick={onCopy}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function widgetLabel(w: { id: string; type: string }): string {
  const rec = w as unknown as Record<string, unknown>;
  const label = rec.label;
  const title = rec.title;
  if (typeof label === "string" && label.trim()) return `${w.type} · ${label}`;
  if (typeof title === "string" && title.trim()) return `${w.type} · ${title}`;
  return `${w.type} · ${w.id.slice(0, 6)}`;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
