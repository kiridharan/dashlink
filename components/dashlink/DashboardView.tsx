"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { DashboardConfig, Dataset } from "@/lib/dashlink/types";
import DashboardRenderer from "./DashboardRenderer";

const REFRESH_INTERVAL_MS = 30_000;

interface Props {
  config: DashboardConfig;
  data: Dataset;
}

export default function DashboardView({ config, data }: Props) {
  const [currentData, setCurrentData] = useState<Dataset>(data);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [copied, setCopied] = useState(false);

  // Simulate auto-refresh – swaps in fresh dummy data every 30 s.
  // Production: replace with a real fetch of config.apiUrl.
  const refresh = useCallback(() => {
    setCurrentData([...data]); // real impl: await fetch(config.apiUrl)
    setLastRefreshed(new Date());
    setCountdown(REFRESH_INTERVAL_MS / 1000);
  }, [data]);

  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Countdown ticker
  useEffect(() => {
    const ticker = setInterval(
      () => setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1)),
      1000,
    );
    return () => clearInterval(ticker);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 hover:text-zinc-600"
          >
            ← DashLink
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-400 sm:block">
              Refreshes in {countdown}s
            </span>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              {copied ? "Copied!" : "Share link"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Dashboard header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {config.title}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-400">
            {config.apiUrl}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>

        <DashboardRenderer config={config} data={currentData} />
      </main>
    </div>
  );
}
