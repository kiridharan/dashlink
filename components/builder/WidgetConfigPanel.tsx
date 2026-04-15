"use client";

import type { DashWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { getFields } from "./configs/shared";
import KpiWidgetConfig from "./configs/KpiWidgetConfig";
import LineWidgetConfig from "./configs/LineWidgetConfig";
import BarWidgetConfig from "./configs/BarWidgetConfig";
import PieWidgetConfig from "./configs/PieWidgetConfig";

interface Props {
  widget: DashWidget;
  data: Dataset;
  onUpdate: (patch: Partial<DashWidget>) => void;
  onClose: () => void;
}

export default function WidgetConfigPanel({
  widget,
  data,
  onUpdate,
  onClose,
}: Props) {
  const { all, numeric, nonNumeric, kindByField } = getFields(data);
  if (!all.length) return null;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            {widget.type}
          </span>
          <span className="text-[10px] text-zinc-300">config</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close config panel"
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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {widget.type === "kpi" && (
          <KpiWidgetConfig
            widget={widget}
            data={data}
            all={all}
            kindByField={kindByField}
            onUpdate={onUpdate}
          />
        )}
        {widget.type === "line" && (
          <LineWidgetConfig
            widget={widget}
            data={data}
            all={all}
            numeric={numeric}
            kindByField={kindByField}
            onUpdate={onUpdate}
          />
        )}
        {widget.type === "bar" && (
          <BarWidgetConfig
            widget={widget}
            data={data}
            all={all}
            numeric={numeric}
            kindByField={kindByField}
            onUpdate={onUpdate}
          />
        )}
        {widget.type === "pie" && (
          <PieWidgetConfig
            widget={widget}
            data={data}
            all={all}
            numeric={numeric}
            nonNumeric={nonNumeric}
            kindByField={kindByField}
            onUpdate={onUpdate}
          />
        )}
        {widget.type === "table" && (
          <p className="text-[10px] text-zinc-400">
            Table widgets display the raw filtered data. No additional config is
            needed.
          </p>
        )}
      </div>
    </aside>
  );
}
