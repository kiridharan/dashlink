"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { ThemeProvider } from "@/lib/dashlink/theme-context";
import { getTheme } from "@/lib/dashlink/themes";
import KpiWidgetCard from "@/components/builder/widgets/KpiWidgetCard";
import LineWidgetChart from "@/components/builder/widgets/LineWidgetChart";
import BarWidgetChart from "@/components/builder/widgets/BarWidgetChart";
import PieWidgetChart from "@/components/builder/widgets/PieWidgetChart";
import TableWidgetView from "@/components/builder/widgets/TableWidgetView";

interface Props {
  projectName: string;
  apiUrl?: string;
  widgets: DashWidget[];
  layout: GridItem[];
  data: Dataset;
  themeId: string;
  publicSlug: string;
}

function renderContent(widget: DashWidget, data: Dataset) {
  switch (widget.type) {
    case "kpi":
      return <KpiWidgetCard widget={widget} data={data} />;
    case "line":
      return <LineWidgetChart widget={widget} data={data} />;
    case "bar":
      return <BarWidgetChart widget={widget} data={data} />;
    case "pie":
      return <PieWidgetChart widget={widget} data={data} />;
    case "table":
      return <TableWidgetView widget={widget} data={data} />;
  }
}

/** Pick a sensible mobile height per widget type. */
function mobileHeight(widget: DashWidget, base: number): number {
  if (widget.type === "kpi") return 140;
  if (widget.type === "table") return Math.max(280, base);
  return Math.max(260, Math.min(base, 320));
}

export default function MobileView({
  projectName,
  apiUrl,
  widgets,
  layout,
  data,
  themeId,
  publicSlug,
}: Props) {
  const theme = getTheme(themeId);
  // Stories-style swiping: keep grid view as default + swipe mode toggle.
  const [mode, setMode] = useState<"stack" | "swipe">("stack");
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedWidgets = layout
    .map((item) => widgets.find((w) => w.id === item.i))
    .filter((w): w is DashWidget => Boolean(w));

  return (
    <ThemeProvider themeId={themeId}>
      <div className="min-h-screen w-full" style={{ background: theme.pageBg }}>
        {/* Mobile-first sticky header */}
        <header
          className="sticky top-0 z-20 border-b backdrop-blur"
          style={{
            background: theme.headerBg,
            borderColor: theme.headerBorderColor,
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/view/${publicSlug}`}
              className="text-xs font-medium hover:opacity-70"
              style={{ color: theme.titleColor }}
            >
              ← Desktop
            </Link>
            <h1
              className="truncate px-2 text-sm font-semibold"
              style={{ color: theme.titleColor }}
            >
              {projectName}
            </h1>
            <button
              onClick={() => setMode(mode === "stack" ? "swipe" : "stack")}
              className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{
                borderColor: theme.headerBorderColor,
                color: theme.titleColor,
              }}
            >
              {mode === "stack" ? "Swipe" : "Stack"}
            </button>
          </div>
          {apiUrl && (
            <div
              className="truncate px-4 pb-2 font-mono text-[10px]"
              style={{ color: theme.mutedColor }}
            >
              {apiUrl.replace(/^https?:\/\//, "")}
            </div>
          )}
        </header>

        {orderedWidgets.length === 0 && (
          <div className="p-12 text-center">
            <p style={{ color: theme.mutedColor }}>No widgets configured.</p>
          </div>
        )}

        {/* Stack mode: full-width vertical scroll */}
        {mode === "stack" && (
          <main className="space-y-3 p-3 pb-12">
            {orderedWidgets.map((widget) => {
              const item = layout.find((l) => l.i === widget.id);
              const height = mobileHeight(widget, item?.height ?? 280);
              return (
                <div
                  key={widget.id}
                  className="overflow-hidden border"
                  style={{
                    background: theme.cardBg,
                    borderColor: theme.cardBorderColor,
                    borderRadius: theme.chart.cardRadius,
                    boxShadow: theme.chart.cardShadow,
                    height,
                  }}
                >
                  {renderContent(widget, data)}
                </div>
              );
            })}
          </main>
        )}

        {/* Swipe mode: snap-paginated cards */}
        {mode === "swipe" && (
          <main className="relative">
            <div
              className="flex snap-x snap-mandatory overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / el.clientWidth);
                if (idx !== activeIndex) setActiveIndex(idx);
              }}
            >
              {orderedWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className="w-screen shrink-0 snap-center px-3 py-4"
                >
                  <div
                    className="overflow-hidden border"
                    style={{
                      background: theme.cardBg,
                      borderColor: theme.cardBorderColor,
                      borderRadius: theme.chart.cardRadius,
                      boxShadow: theme.chart.cardShadow,
                      height: "calc(100vh - 180px)",
                    }}
                  >
                    {renderContent(widget, data)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-1.5 py-3">
              {orderedWidgets.map((_, idx) => (
                <span
                  key={idx}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: idx === activeIndex ? 18 : 6,
                    background:
                      idx === activeIndex
                        ? theme.titleColor
                        : theme.cardBorderColor,
                  }}
                />
              ))}
            </div>
          </main>
        )}
      </div>
    </ThemeProvider>
  );
}
