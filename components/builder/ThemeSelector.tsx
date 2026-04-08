"use client";

import { useState, useRef, useEffect } from "react";
import {
  DESIGN_SYSTEM_THEMES,
  COLOR_THEMES,
  getTheme,
} from "@/lib/dashlink/themes";
import type { DashTheme } from "@/lib/dashlink/themes";

interface Props {
  currentThemeId: string;
  onSelect: (themeId: string) => void;
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: DashTheme;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative flex w-full flex-col gap-1 rounded-lg p-2 text-left transition-all hover:bg-zinc-50"
      style={
        isActive
          ? {
              outline: `2px solid ${theme.chartColors[0]}`,
              outlineOffset: 2,
              background: `${theme.chartColors[0]}10`,
            }
          : {}
      }
      title={theme.name}
    >
      {/* Mini dashboard mockup */}
      <div
        className="relative flex h-10 w-full items-end gap-0.5 overflow-hidden rounded-md p-1.5"
        style={{
          background: theme.pageBg,
          border: `1px solid ${theme.cardBorderColor}`,
        }}
      >
        {/* Tiny bar chart preview */}
        {[60, 90, 45, 75, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: theme.chartColors[i % theme.chartColors.length],
              borderRadius: `${theme.chart.barRadius[0]}px ${theme.chart.barRadius[1]}px 0 0`,
              opacity: 0.9,
            }}
          />
        ))}
        {/* KPI badge in top-right */}
        <div
          className="absolute right-1 top-1 rounded px-1 text-[7px] font-bold leading-none"
          style={{
            background: theme.cardBg,
            color: theme.kpiValueColor,
            border: `1px solid ${theme.cardBorderColor}`,
            borderRadius: theme.chart.cardRadius / 2,
          }}
        >
          KPI
        </div>
      </div>
      {/* Theme name */}
      <span
        className="truncate text-[10px] font-medium"
        style={{ color: theme.mutedColor }}
      >
        {theme.name}
      </span>
      {/* Chart style badge */}
      <span
        className="w-fit rounded-sm px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide"
        style={{
          background: `${theme.chartColors[0]}15`,
          color: theme.chartColors[0],
        }}
      >
        {theme.chart.lineArea
          ? "area"
          : theme.chart.lineType === "step"
            ? "step"
            : "line"}{" "}
        ·{" "}
        {theme.chart.barRadius[0] > 4
          ? "pill"
          : theme.chart.barRadius[0] > 0
            ? "round"
            : "flat"}
      </span>
    </button>
  );
}

export default function ThemeSelector({ currentThemeId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"design" | "color">("design");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = getTheme(currentThemeId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change dashboard theme"
        className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
      >
        {/* Live swatches */}
        <span className="flex gap-0.5">
          {current.preview.map((color, i) => (
            <span
              key={i}
              className="inline-block h-3 w-3 rounded-sm shadow-sm"
              style={{ background: color }}
            />
          ))}
        </span>
        <span className="leading-none">{current.name}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-96 rounded-xl border border-zinc-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-zinc-100 px-4 pt-3 pb-0">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Dashboard Theme
            </p>
            {/* Tabs */}
            <div className="flex gap-0">
              {(["design", "color"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-3 pb-2 text-[11px] font-semibold capitalize transition ${
                    tab === t
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {t === "design" ? "Design Systems" : "Color Palettes"}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="p-3">
            {tab === "design" && (
              <>
                <p className="mb-2 text-[10px] text-zinc-400">
                  Themes inspired by popular UI component libraries
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {DESIGN_SYSTEM_THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={theme.id === currentThemeId}
                      onSelect={() => {
                        onSelect(theme.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            {tab === "color" && (
              <>
                <p className="mb-2 text-[10px] text-zinc-400">
                  Vivid color palettes for expressive dashboards
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {COLOR_THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={theme.id === currentThemeId}
                      onSelect={() => {
                        onSelect(theme.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer: active theme info */}
          <div className="border-t border-zinc-100 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex gap-0.5">
                  {current.preview.map((c, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="text-[10px] font-semibold text-zinc-700">
                  {current.name}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                  style={{
                    background: `${current.chartColors[0]}15`,
                    color: current.chartColors[0],
                  }}
                >
                  {current.category === "design-system"
                    ? "Design System"
                    : "Color"}
                </span>
              </div>
              <span className="text-[9px] text-zinc-400">
                {current.chart.lineArea ? "Area lines" : "Plain lines"} · r=
                {current.chart.barRadius[0]}px bars
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
