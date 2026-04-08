import type { KpiSummary } from "@/lib/dashlink/types";

export default function KpiCard({
  label,
  formatted,
}: Pick<KpiSummary, "label" | "formatted">) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
        {formatted}
      </p>
    </div>
  );
}
