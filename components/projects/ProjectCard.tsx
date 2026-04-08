import Link from "next/link";
import type { Project } from "@/lib/store/project-store";

interface Props {
  project: Project;
  onDelete: (id: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProjectCard({ project, onDelete }: Props) {
  const widgetCount = project.widgets.length;
  const hasData = project.data.length > 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
      {/* Delete */}
      <button
        onClick={() => onDelete(project.id)}
        aria-label="Delete project"
        className="absolute right-4 top-4 hidden rounded-md p-1 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-4 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${hasData ? "bg-emerald-400" : "bg-zinc-300"}`}
          />
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {hasData ? "Active" : "No data"}
          </span>
        </div>
        <h3 className="text-base font-semibold text-zinc-900 leading-tight">
          {project.name}
        </h3>
        {project.apiUrl && (
          <p className="mt-1 truncate font-mono text-xs text-zinc-400">
            {project.apiUrl}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4 text-xs text-zinc-500">
        <span>
          {widgetCount} widget{widgetCount !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>{relativeTime(project.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 rounded-lg bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition hover:bg-zinc-700"
        >
          Open builder
        </Link>
        {hasData && (
          <Link
            href={`/view/${project.id}`}
            target="_blank"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-400"
          >
            ↗ View
          </Link>
        )}
      </div>
    </div>
  );
}
