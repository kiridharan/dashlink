"use client";

import type {
  AggregationMetric,
  DashWidget,
  KpiWidget,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import type { FieldKind } from "./shared";
import {
  SectionLabel,
  FieldRow,
  Toggle,
  SEL,
  ALL_METRICS,
  getIntelligentMetrics,
} from "./shared";

interface Props {
  widget: KpiWidget;
  data: Dataset;
  all: string[];
  kindByField: Record<string, FieldKind>;
  onUpdate: (patch: Partial<DashWidget>) => void;
}

export default function KpiWidgetConfig({
  widget,
  all,
  kindByField,
  onUpdate,
}: Props) {
  return (
    <>
      <SectionLabel>Data</SectionLabel>
      <FieldRow label="Field" title="Pick the field used for this KPI">
        <select
          className={SEL}
          value={widget.field}
          onChange={(e) =>
            onUpdate({ field: e.target.value } as Partial<DashWidget>)
          }
        >
          {all.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Metric" title="Choose the KPI calculation">
        <select
          className={SEL}
          value={widget.metric ?? "sum"}
          onChange={(e) =>
            onUpdate({
              metric: e.target.value as AggregationMetric,
            } as Partial<DashWidget>)
          }
        >
          {getIntelligentMetrics(kindByField[widget.field]).map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[9px] text-zinc-400">
          {ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))?.help}
        </p>
      </FieldRow>

      <SectionLabel>Options</SectionLabel>
      <Toggle
        checked={widget.compareEnabled ?? false}
        onChange={(v) => onUpdate({ compareEnabled: v } as Partial<DashWidget>)}
        label="Compare to previous period"
        title="Shows delta compared to first half of data"
      />
      <Toggle
        checked={widget.hideNulls ?? false}
        onChange={(v) => onUpdate({ hideNulls: v } as Partial<DashWidget>)}
        label="Hide null values"
        title="Exclude null/empty values from calculation"
      />
    </>
  );
}
