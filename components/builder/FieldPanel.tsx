"use client";

import type {
  DashWidget,
  GridItem,
  WidgetType,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { formatLabel, sumField, formatNumber } from "@/lib/dashlink/utils";

// ---------------------------------------------------------------------------
// Field inference (mirrors wizard logic)
// ---------------------------------------------------------------------------

type FieldKind = "numeric" | "date" | "categorical" | "text";

function inferKind(samples: unknown[]): FieldKind {
  const s = samples.filter((v) => v !== null && v !== undefined && v !== "");
  if (!s.length) return "text";
  if (
    s.every(
      (v) =>
        typeof v === "number" ||
        (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))),
    )
  )
    return "numeric";
  if (s.every((v) => typeof v === "string" && /^\d{4}[-/]/.test(v as string)))
    return "date";
  const uniq = new Set(s);
  if (uniq.size <= Math.max(10, Math.floor(s.length * 0.3)))
    return "categorical";
  return "text";
}

const KIND_BADGE: Record<FieldKind, { label: string; cls: string }> = {
  numeric: { label: "123", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  date: {
    label: "Date",
    cls: "bg-purple-50 text-purple-600 border-purple-200",
  },
  categorical: {
    label: "ABC",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  text: { label: "Txt", cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

// Generic widget templates (for adding blank widgets)
const GENERIC_TEMPLATES: Array<{
  type: WidgetType;
  icon: string;
  label: string;
}> = [
  { type: "kpi", icon: "◆", label: "KPI Card" },
  { type: "line", icon: "↗", label: "Line Chart" },
  { type: "bar", icon: "▇", label: "Bar Chart" },
  { type: "pie", icon: "◕", label: "Pie Chart" },
  { type: "table", icon: "⊞", label: "Table" },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  data: Dataset;
  apiUrl?: string;
  authType?: string;
  existingWidgetIds: Set<string>;
  onAdd: (widget: DashWidget, gridItem: GridItem) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FieldPanel({
  data,
  apiUrl,
  authType,
  existingWidgetIds,
  onAdd,
}: Props) {
  const hasData = data.length > 0;

  // Detect fields
  const fields = hasData
    ? Object.keys(data[0]).map((name) => ({
        name,
        kind: inferKind(data.slice(0, 20).map((r) => r[name])),
      }))
    : [];

  const numericFields = fields.filter((f) => f.kind === "numeric");
  const dateFields = fields.filter((f) => f.kind === "date");
  const catFields = fields.filter((f) => f.kind === "categorical");
  const defaultMetric = numericFields.length > 0 ? "sum" : "count";

  // ---- Quick-add helpers ----

  const addKpi = (fieldName: string) => {
    const id = `kpi-${fieldName}-${uid()}`;
    onAdd(
      {
        id,
        type: "kpi",
        field: fieldName,
        label: `Total ${formatLabel(fieldName)}`,
        metric: "sum",
      },
      { i: id, span: 3, height: 120 },
    );
  };

  const addLine = (yField: string) => {
    const xField = dateFields[0]?.name ?? catFields[0]?.name;
    if (!xField) return;
    const id = `line-${yField}-${uid()}`;
    onAdd(
      {
        id,
        type: "line",
        x: xField,
        y: yField,
        label: `${formatLabel(yField)} over ${formatLabel(xField)}`,
        metric: defaultMetric,
      },
      { i: id, span: 6, height: 280 },
    );
  };

  const addBar = (yField: string) => {
    const xField = catFields[0]?.name ?? dateFields[0]?.name;
    if (!xField) return;
    const id = `bar-${yField}-${uid()}`;
    const metric = numericFields.length > 0 ? "sum" : "count";
    onAdd(
      {
        id,
        type: "bar",
        x: xField,
        y: yField,
        label:
          metric === "count"
            ? `Count by ${formatLabel(xField)}`
            : `${formatLabel(yField)} by ${formatLabel(xField)}`,
        metric,
      },
      { i: id, span: 6, height: 280 },
    );
  };

  const addPie = (categoryField: string) => {
    const valueField = numericFields[0]?.name ?? categoryField;
    const id = `pie-${categoryField}-${uid()}`;
    const metric = numericFields.length > 0 ? "sum" : "count";
    onAdd(
      {
        id,
        type: "pie",
        category: categoryField,
        value: valueField,
        label: `${formatLabel(categoryField)} breakdown`,
        metric,
      },
      { i: id, span: 6, height: 280 },
    );
  };

  const addGeneric = (type: WidgetType) => {
    const id = `${type}-${uid()}`;
    if (type === "table") {
      onAdd({ id, type: "table" }, { i: id, span: 12, height: 320 });
      return;
    }
    const xField =
      dateFields[0]?.name ?? catFields[0]?.name ?? fields[0]?.name ?? "x";
    const yField = numericFields[0]?.name ?? fields[1]?.name ?? xField;
    const metric = numericFields.length > 0 ? "sum" : "count";
    if (type === "kpi") {
      onAdd(
        {
          id,
          type: "kpi",
          field: numericFields[0]?.name ?? xField,
          label:
            metric === "count"
              ? `Count of ${formatLabel(xField)}`
              : `Total ${formatLabel(yField)}`,
          metric,
        },
        { i: id, span: 3, height: 120 },
      );
    } else if (type === "line") {
      onAdd(
        {
          id,
          type: "line",
          x: xField,
          y: yField,
          label:
            metric === "count"
              ? `Count over ${formatLabel(xField)}`
              : `${formatLabel(yField)} over ${formatLabel(xField)}`,
          metric,
        },
        { i: id, span: 6, height: 280 },
      );
    } else if (type === "bar") {
      onAdd(
        {
          id,
          type: "bar",
          x: xField,
          y: yField,
          label:
            metric === "count"
              ? `Count by ${formatLabel(xField)}`
              : `${formatLabel(yField)} by ${formatLabel(xField)}`,
          metric,
        },
        { i: id, span: 6, height: 280 },
      );
    } else if (type === "pie") {
      const cat = catFields[0]?.name ?? xField;
      onAdd(
        {
          id,
          type: "pie",
          category: cat,
          value: metric === "count" ? cat : yField,
          label: `${formatLabel(cat)} breakdown`,
          metric,
        },
        { i: id, span: 6, height: 280 },
      );
    }
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-5 overflow-y-auto">
      {/* Data source info */}
      {apiUrl && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Data source
          </p>
          <p
            className="truncate font-mono text-[11px] text-zinc-500"
            title={apiUrl}
          >
            {apiUrl.replace(/^https?:\/\//, "")}
          </p>
          {authType && authType !== "none" && (
            <span className="mt-1 inline-flex items-center rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-500">
              {authType === "bearer"
                ? "Bearer"
                : authType === "apikey"
                  ? "API Key"
                  : "Basic Auth"}
            </span>
          )}
          <p className="mt-1.5 text-[10px] text-zinc-400">
            {data.length} rows loaded
          </p>
        </div>
      )}

      {/* Detected fields */}
      {hasData && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Fields
          </p>
          <div className="space-y-1.5">
            {fields.map(({ name, kind }) => {
              const badge = KIND_BADGE[kind];
              return (
                <div
                  key={name}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-2"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex rounded border px-1 py-0.5 font-mono text-[9px] font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="truncate text-[11px] font-medium text-zinc-700">
                      {name}
                    </span>
                  </div>

                  {kind === "numeric" && (
                    <div className="mb-1 text-[10px] text-zinc-400">
                      Σ {formatNumber(sumField(data, name))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {kind === "numeric" && (
                      <>
                        <button
                          onClick={() => addKpi(name)}
                          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400"
                        >
                          KPI
                        </button>
                        <button
                          onClick={() => addLine(name)}
                          disabled={!dateFields.length && !catFields.length}
                          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                        >
                          Line
                        </button>
                        <button
                          onClick={() => addBar(name)}
                          disabled={!catFields.length && !dateFields.length}
                          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                        >
                          Bar
                        </button>
                      </>
                    )}
                    {kind === "categorical" && (
                      <>
                        <button
                          onClick={() => addPie(name)}
                          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                        >
                          Pie
                        </button>
                        <button
                          onClick={() => {
                            const vf = numericFields[0]?.name ?? name;
                            const metric =
                              numericFields.length > 0 ? "sum" : "count";
                            const id = `bar-${name}-${uid()}`;
                            onAdd(
                              {
                                id,
                                type: "bar",
                                x: name,
                                y: vf,
                                label:
                                  metric === "count"
                                    ? `Count by ${formatLabel(name)}`
                                    : `${formatLabel(vf)} by ${formatLabel(name)}`,
                                metric,
                              },
                              { i: id, span: 6, height: 280 },
                            );
                          }}
                          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                        >
                          Bar
                        </button>
                      </>
                    )}
                    {(kind === "date" || kind === "text") && (
                      <span className="text-[9px] text-zinc-400">
                        axis field
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generic widget add */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Add widget
        </p>
        <div className="space-y-1">
          {GENERIC_TEMPLATES.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => addGeneric(type)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-left text-xs transition hover:border-zinc-400 hover:shadow-sm"
            >
              <span>{icon}</span>
              <span className="font-medium text-zinc-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
