"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ProjectVersion } from "@/lib/supabase/queries";
import { diffWidgets } from "@/lib/dashlink/diff";

interface Props {
  projectId: string;
  projectName: string;
  versions: ProjectVersion[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryClient({
  projectId,
  projectName,
  versions,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(
    versions[0]?.version ?? null,
  );
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = useMemo(
    () => versions.find((v) => v.version === selected) ?? null,
    [versions, selected],
  );
  const previous = useMemo(() => {
    if (!current) return null;
    return versions.find((v) => v.version === current.version - 1) ?? null;
  }, [versions, current]);

  const diff = useMemo(() => {
    if (!current || !previous) return [];
    return diffWidgets(previous.widgets, current.widgets);
  }, [current, previous]);

  const handleRestore = async () => {
    if (!current) return;
    if (!confirm(`Restore dashboard to version ${current.version}?`)) return;
    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/versions/${current.version}/restore`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Restore failed");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              ← Back to builder
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-semibold text-zinc-900">
              {projectName}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              History
            </span>
          </div>
          {current && current.version !== versions[0]?.version && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {restoring ? "Restoring…" : `Restore v${current.version}`}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-6 py-8">
        {/* Sidebar — version list */}
        <aside className="col-span-4 space-y-1">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Versions ({versions.length})
          </h2>
          {versions.length === 0 && (
            <p className="text-sm text-zinc-400">No history yet.</p>
          )}
          {versions.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.version)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                selected === v.version
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <div>
                <div className="font-semibold">
                  v{v.version}
                  {idx === 0 && (
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        selected === v.version
                          ? "bg-white text-zinc-900"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      current
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs ${selected === v.version ? "text-zinc-300" : "text-zinc-500"}`}
                >
                  {formatDate(v.createdAt)}
                  {v.summary ? ` · ${v.summary}` : ""}
                </div>
              </div>
              <span
                className={`text-xs ${selected === v.version ? "text-zinc-300" : "text-zinc-400"}`}
              >
                {v.widgets.length}
              </span>
            </button>
          ))}
        </aside>

        {/* Diff view */}
        <section className="col-span-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!current ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-24 text-center text-sm text-zinc-400">
              Select a version to inspect.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Version {current.version}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {formatDate(current.createdAt)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-zinc-500">
                  <div>
                    <div className="text-[10px] uppercase">Name</div>
                    <div className="font-medium text-zinc-900">
                      {current.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase">Theme</div>
                    <div className="font-medium text-zinc-900">
                      {current.theme}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase">Widgets</div>
                    <div className="font-medium text-zinc-900">
                      {current.widgets.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  {previous
                    ? `Changes since v${previous.version}`
                    : "Initial version"}
                </h3>
                {!previous ? (
                  <p className="text-sm text-zinc-400">
                    This is the first recorded version.
                  </p>
                ) : diff.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No widget changes between these versions.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {diff.map((d) => (
                      <li
                        key={`${d.id}-${d.type}`}
                        className="rounded-lg border border-zinc-100 p-3"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold uppercase ${
                              d.type === "added"
                                ? "bg-emerald-100 text-emerald-700"
                                : d.type === "removed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {d.type}
                          </span>
                          <span className="font-mono text-zinc-500">
                            {d.id}
                          </span>
                          <span className="text-zinc-400">
                            ({d.widget.type})
                          </span>
                        </div>
                        {d.changes && (
                          <table className="mt-2 w-full text-xs">
                            <tbody>
                              {d.changes.map((c) => (
                                <tr key={c.field} className="border-t">
                                  <td className="py-1 pr-2 font-mono text-zinc-500">
                                    {c.field}
                                  </td>
                                  <td className="py-1 pr-2 text-red-600 line-through">
                                    {JSON.stringify(c.before)}
                                  </td>
                                  <td className="py-1 text-emerald-700">
                                    {JSON.stringify(c.after)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
