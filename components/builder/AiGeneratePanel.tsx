"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DashWidget,
  FilterControl,
  GridItem,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import {
  getDateFields,
  getNumericFields,
  getDatasetFields,
} from "@/lib/dashlink/filters";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiDashboardSpec {
  name: string;
  mode: "replace" | "add";
  widgets: DashWidget[];
  layout: GridItem[];
  filters: FilterControl[];
}

export interface AiWidgetEdit {
  id: string;
  patch: Partial<DashWidget>;
  layoutPatch?: Partial<Pick<GridItem, "span" | "height">>;
}

export interface AiDashboardModification {
  remove: string[];
  edits: AiWidgetEdit[];
}

interface Props {
  data: Dataset;
  /** Widgets currently on the canvas, so the AI can add vs replace */
  currentWidgets: DashWidget[];
  onApply: (spec: AiDashboardSpec) => void;
  /** Remove/edit existing widgets (removals are user-confirmed in chat) */
  onModify: (mod: AiDashboardModification) => void;
  /** True while the staggered build animation is running */
  isApplying: boolean;
}

function describeWidget(w: DashWidget): string {
  switch (w.type) {
    case "kpi":
      return `kpi "${w.label}" (${w.metric ?? "sum"} of ${w.field})`;
    case "line":
      return `line "${w.label}" (${w.y} over ${w.x})`;
    case "bar":
      return `bar "${w.label}" (${w.y} by ${w.x})`;
    case "pie":
      return `pie "${w.label}" (${w.value} by ${w.category})`;
    case "table":
      return `table (${w.columns?.join(", ") ?? "all columns"})`;
  }
}

function buildFieldSummary(data: Dataset) {
  const numeric = new Set(getNumericFields(data));
  const dates = new Set(getDateFields(data));
  return getDatasetFields(data).map((name) => ({
    name,
    kind: dates.has(name) ? "date" : numeric.has(name) ? "numeric" : "categorical",
    samples: data
      .slice(0, 3)
      .map((row) => String(row[name] ?? ""))
      .filter(Boolean)
      .map((s) => (s.length > 40 ? s.slice(0, 40) + "…" : s)),
  }));
}

export default function AiGeneratePanel({
  data,
  currentWidgets,
  onApply,
  onModify,
  isApplying,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || isApplying) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          fields: buildFieldSummary(data),
          rowCount: data.length,
          existingWidgets: currentWidgets.map((w) => ({
            id: w.id,
            type: w.type,
            description: describeWidget(w),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed.");

      if (json.type === "dashboard") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${
              json.mode === "add"
                ? `Adding ${json.widgets.length} widgets to your dashboard`
                : `Building “${json.name}” — ${json.widgets.length} widgets`
            }${
              json.filters.length ? ` and ${json.filters.length} filters` : ""
            }…`,
          },
        ]);
        setDone(true);
        onApply({
          name: json.name,
          mode: json.mode === "add" ? "add" : "replace",
          widgets: json.widgets,
          layout: json.layout,
          filters: json.filters,
        });
      } else if (json.type === "modify") {
        const parts: string[] = [];
        if (json.remove.length)
          parts.push(
            `removing ${json.remove.length} widget${json.remove.length > 1 ? "s" : ""}`,
          );
        if (json.edits.length)
          parts.push(
            `updating ${json.edits.length} widget${json.edits.length > 1 ? "s" : ""}`,
          );
        const summary = parts.join(" and ");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: summary.charAt(0).toUpperCase() + summary.slice(1) + "… done!",
          },
        ]);
        onModify({ remove: json.remove, edits: json.edits });
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.text },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
      // Roll the failed user turn back so it can be retried.
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
    setDone(false);
    setInput("");
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={data.length === 0}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
        title={
          data.length === 0
            ? "Connect a data source first"
            : "Generate a dashboard with AI"
        }
      >
        <span aria-hidden>✨</span>
        Generate AI
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                ✨ AI Dashboard Generator
              </p>
              <p className="text-[11px] text-zinc-400">
                Describe the dashboard you want — it knows your {data.length}{" "}
                rows and {getDatasetFields(data).length} fields.
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI panel"
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Try something like:</p>
                {[
                  "Build a sales dashboard",
                  "Show revenue trends and top categories",
                  "Give me an overview of this data",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-100 px-3 py-2 text-xs text-zinc-500 w-fit">
                <span className="ai-dot" />
                <span className="ai-dot" style={{ animationDelay: "0.15s" }} />
                <span className="ai-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
            {isApplying && (
              <p className="text-xs font-medium text-indigo-600">
                Placing widgets on the canvas…
              </p>
            )}
            {done && !isApplying && (
              <p className="text-xs font-medium text-emerald-600">
                Dashboard built! Tweak anything on the canvas, or Reset to start
                over.
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-zinc-100 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                done ? "Ask for a different dashboard…" : "I want to build a sales dashboard…"
              }
              disabled={loading || isApplying}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-800 outline-none focus:border-indigo-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || isApplying || !input.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>

          <style>{`
            .ai-dot {
              width: 5px;
              height: 5px;
              border-radius: 999px;
              background: #a1a1aa;
              animation: ai-bounce 1s infinite ease-in-out;
            }
            @keyframes ai-bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
              40% { transform: translateY(-4px); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
