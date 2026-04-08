"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDashboard } from "@/lib/dashlink/actions";

const EXAMPLE_URLS = [
  "https://api.example.com/v1/sales",
  "https://api.example.com/v1/metrics",
];

export default function UrlInputForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await generateDashboard(url.trim());
      if (result.success) {
        router.push(`/view/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/data"
          className="flex-1 bg-transparent px-4 py-4 text-base text-zinc-900 placeholder-zinc-400 outline-none"
          disabled={isPending}
          autoFocus
          aria-label="API endpoint URL"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !url.trim()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating…
          </>
        ) : (
          "Generate Dashboard →"
        )}
      </button>

      {/* Quick-fill examples */}
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span>Try:</span>
        {EXAMPLE_URLS.map((exUrl) => (
          <button
            key={exUrl}
            type="button"
            onClick={() => setUrl(exUrl)}
            className="font-mono text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
          >
            {exUrl}
          </button>
        ))}
      </div>
    </form>
  );
}
