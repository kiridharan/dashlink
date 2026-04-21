"use client";

import { useEffect, useState } from "react";

const API_URL = "https://api.shop.dev/orders.json";

const KPI_TARGETS = [128400, 3847, 1209];
const KPI_LABELS = ["Revenue", "Users", "Orders"];
const KPI_PREFIXES = ["$", "", ""];

function useTyping(text: string, speed = 45) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    setOut("");
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return out;
}

function useCountUp(target: number, durationMs = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export default function HeroMock() {
  const typed = useTyping(API_URL, 38);
  const showCursor = typed.length < API_URL.length;

  return (
    <div className="relative">
      {/* Soft halo */}
      <div className="pointer-events-none absolute -inset-6 rounded-4xl bg-linear-to-tr from-violet-200/50 via-transparent to-cyan-200/50 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          </div>
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-white px-2.5 py-1 ring-1 ring-zinc-200">
            <span className="text-[10px] font-semibold text-emerald-600">
              GET
            </span>
            <span className="font-mono text-[11px] text-zinc-700">
              {typed}
              {showCursor && (
                <span className="ml-0.5 inline-block h-3 w-[1.5px] -translate-y-px animate-pulse bg-zinc-700 align-middle" />
              )}
            </span>
          </div>
          <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline">
            200 OK
          </span>
        </div>

        {/* Dashboard body */}
        <div className="grid grid-cols-4 gap-3 p-4">
          {KPI_TARGETS.map((target, i) => (
            <KpiTile
              key={KPI_LABELS[i]}
              label={KPI_LABELS[i]}
              value={target}
              prefix={KPI_PREFIXES[i]}
              accent={
                ["bg-violet-500", "bg-cyan-500", "bg-fuchsia-500"][i] ?? ""
              }
            />
          ))}
          <div className="col-span-1 rounded-xl border border-zinc-100 bg-white p-3">
            <p className="text-[10px] font-medium text-zinc-400">Conversion</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">3.42%</p>
            <p className="mt-1 text-[10px] font-medium text-emerald-600">
              ▲ 0.6%
            </p>
          </div>

          {/* Bar chart */}
          <div className="col-span-2 row-span-2 rounded-xl border border-zinc-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-zinc-700">
                Revenue · last 12 weeks
              </p>
              <span className="text-[9px] text-zinc-400">USD</span>
            </div>
            <div className="flex h-32 items-end gap-1">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-linear-to-t from-zinc-900 to-zinc-600"
                  style={{
                    height: "0%",
                    animation: `dashlink-bar 900ms cubic-bezier(.2,.8,.2,1) forwards`,
                    animationDelay: `${300 + i * 60}ms`,
                    ["--h" as never]: `${h}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sparkline / line */}
          <div className="col-span-2 rounded-xl border border-zinc-100 bg-white p-3">
            <p className="text-[10px] font-semibold text-zinc-700">
              Active users
            </p>
            <svg
              viewBox="0 0 100 36"
              preserveAspectRatio="none"
              className="mt-1 h-16 w-full"
            >
              <defs>
                <linearGradient id="dl-line" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(139,92,246)"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(139,92,246)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d="M0,28 L10,24 L20,26 L30,18 L40,20 L50,12 L60,16 L70,8 L80,10 L90,4 L100,6 L100,36 L0,36 Z"
                fill="url(#dl-line)"
              />
              <path
                d="M0,28 L10,24 L20,26 L30,18 L40,20 L50,12 L60,16 L70,8 L80,10 L90,4 L100,6"
                fill="none"
                stroke="rgb(139,92,246)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 220,
                  strokeDashoffset: 220,
                  animation: "dashlink-draw 1400ms ease-out forwards",
                  animationDelay: "500ms",
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dashlink-bar {
          to {
            height: var(--h);
          }
        }
        @keyframes dashlink-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

function KpiTile({
  label,
  value,
  prefix,
  accent,
}: {
  label: string;
  value: number;
  prefix: string;
  accent: string;
}) {
  const n = useCountUp(value);
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
        <p className="text-[10px] font-medium text-zinc-400">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
        {prefix}
        {formatNumber(n)}
      </p>
      <p className="mt-1 text-[10px] font-medium text-emerald-600">▲ live</p>
    </div>
  );
}
