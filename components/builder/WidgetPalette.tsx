"use client";

import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { sumField, formatLabel, formatNumber } from "@/lib/dashlink/utils";

interface Props {
  data: Dataset;
  existingWidgetIds: Set<string>;
  onAdd: (widget: DashWidget, gridItem: GridItem) => void;
}

// Available "blank" widget templates
const WIDGET_TEMPLATES: Array<{
  type: DashWidget["type"];
  icon: string;
  label: string;
  description: string;
}> = [
  { type: "kpi", icon: "📊", label: "KPI Card", description: "Single metric" },
  {
    type: "line",
    icon: "📈",
    label: "Line Chart",
    description: "Trend over time",
  },
  {
    type: "bar",
    icon: "📉",
    label: "Bar Chart",
    description: "Compare values",
  },
  { type: "table", icon: "🗂", label: "Table", description: "Raw data view" },
];

function defaultGridItem(type: DashWidget["type"]): Omit<GridItem, "i"> {
  switch (type) {
    case "kpi":
      return { span: 3, height: 120 };
    case "line":
      return { span: 6, height: 280 };
    case "bar":
      return { span: 6, height: 280 };
    case "table":
      return { span: 12, height: 320 };
  }
}

function buildWidget(
  type: DashWidget["type"],
  data: Dataset,
  id: string,
): DashWidget {
  if (!data.length) {
    switch (type) {
      case "kpi":
        return { id, type, field: "value", label: "Value" };
      case "line":
        return { id, type, x: "x", y: "y", label: "Line" };
      case "bar":
        return { id, type, x: "x", y: "y", label: "Bar" };
      case "table":
        return { id, type };
    }
  }

  const fields = Object.keys(data[0]);
  const numericFields = fields.filter(
    (f) => typeof data[0][f] === "number" || !isNaN(Number(data[0][f])),
  );
  const categoryFields = fields.filter((f) => !numericFields.includes(f));
  const xField = categoryFields[0] ?? fields[0];
  const yField = numericFields[0] ?? fields[1] ?? fields[0];

  switch (type) {
    case "kpi": {
      const field = numericFields[0] ?? fields[0];
      const total = sumField(data, field);
      return { id, type, field, label: `Total ${formatLabel(field)}` };
    }
    case "line":
      return {
        id,
        type,
        x: xField,
        y: yField,
        label: `${formatLabel(yField)} over ${formatLabel(xField)}`,
      };
    case "bar":
      return {
        id,
        type,
        x: xField,
        y: yField,
        label: `${formatLabel(yField)} by ${formatLabel(xField)}`,
      };
    case "table":
      return { id, type };
  }
}

export default function WidgetPalette({
  data,
  existingWidgetIds,
  onAdd,
}: Props) {
  const handleAdd = (type: DashWidget["type"]) => {
    const id = `${type}-${Date.now().toString(36)}`;
    const widget = buildWidget(type, data, id);
    const pos = defaultGridItem(type);
    onAdd(widget, { i: id, ...pos });
  };

  // Show suggested fields when data is available
  const numericFields = data.length
    ? Object.keys(data[0]).filter(
        (f) => typeof data[0][f] === "number" || !isNaN(Number(data[0][f])),
      )
    : [];

  return (
    <aside className="flex w-52 shrink-0 flex-col gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Add widget
        </p>
        <div className="space-y-1.5">
          {WIDGET_TEMPLATES.map(({ type, icon, label, description }) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-zinc-400 hover:shadow-sm"
            >
              <span className="text-base">{icon}</span>
              <div>
                <p className="text-xs font-semibold text-zinc-700">{label}</p>
                <p className="text-[10px] text-zinc-400">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available fields hint */}
      {numericFields.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Numeric fields
          </p>
          <div className="space-y-1">
            {numericFields.map((f) => {
              const total = sumField(data, f);
              return (
                <div
                  key={f}
                  className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-1.5"
                >
                  <span className="text-xs font-medium text-zinc-600">
                    {formatLabel(f)}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {formatNumber(total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
