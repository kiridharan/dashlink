"use client";

import type {
  AggregationMetric,
  DashWidget,
  PieWidget,
  SortDirection,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import type { FieldKind } from "./shared";
import {
  SectionLabel,
  FieldRow,
  Toggle,
  SEL,
  NUM_INPUT,
  ALL_METRICS,
  SORT_OPTIONS,
  getIntelligentMetrics,
  metricFieldOptions,
  uniqueValueCount,
} from "./shared";

interface Props {
  widget: PieWidget;
  data: Dataset;
  all: string[];
  numeric: string[];
  nonNumeric: string[];
  kindByField: Record<string, FieldKind>;
  onUpdate: (patch: Partial<DashWidget>) => void;
}

export default function PieWidgetConfig({
  widget,
  data,
  all,
  numeric,
  nonNumeric,
  kindByField,
  onUpdate,
}: Props) {
  return (
    <>
      <SectionLabel>Data</SectionLabel>
      <FieldRow label="Category" title="Category field">
        <select
          className={SEL}
          value={widget.category}
          onChange={(e) =>
            onUpdate({ category: e.target.value } as Partial<DashWidget>)
          }
        >
          {(nonNumeric.length > 0 ? nonNumeric : all).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Value" title="Field to measure">
        <select
          className={SEL}
          value={widget.value}
          onChange={(e) =>
            onUpdate({ value: e.target.value } as Partial<DashWidget>)
          }
        >
          {metricFieldOptions(all, numeric, widget.metric).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Metric" title="How values are aggregated">
        <select
          className={SEL}
          value={widget.metric ?? "sum"}
          onChange={(e) =>
            onUpdate({
              metric: e.target.value as AggregationMetric,
            } as Partial<DashWidget>)
          }
        >
          {getIntelligentMetrics(kindByField[widget.value]).map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[9px] text-zinc-400">
          {ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))?.help}
        </p>
      </FieldRow>

      <SectionLabel>Sorting &amp; Limits</SectionLabel>
      <FieldRow label="Sort" title="Sort by aggregated value">
        <select
          className={SEL}
          value={widget.sort ?? "desc"}
          onChange={(e) =>
            onUpdate({
              sort: e.target.value as SortDirection,
            } as Partial<DashWidget>)
          }
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Top N" title="Limit displayed slices">
        <input
          type="number"
          min={1}
          max={50}
          className={NUM_INPUT}
          value={widget.topN ?? ""}
          onChange={(e) =>
            onUpdate({
              topN: e.target.value ? Number(e.target.value) : undefined,
            } as Partial<DashWidget>)
          }
          placeholder="8"
        />
      </FieldRow>

      <SectionLabel>Options</SectionLabel>
      {(widget.topN ?? 0) > 0 && (
        <Toggle
          checked={widget.showOtherBucket ?? false}
          onChange={(v) =>
            onUpdate({ showOtherBucket: v } as Partial<DashWidget>)
          }
          label={`Show "Other" bucket`}
          title="Aggregate remaining slices into Other"
        />
      )}
      <Toggle
        checked={widget.hideNulls ?? false}
        onChange={(v) => onUpdate({ hideNulls: v } as Partial<DashWidget>)}
        label="Hide null values"
        title="Exclude null/empty values"
      />
      {widget.metric === "countDistinct" &&
        uniqueValueCount(data, widget.category) > 50 && (
          <p className="text-[9px] text-amber-600">
            High cardinality ({uniqueValueCount(data, widget.category)} unique
            values). Consider adding a Top N limit.
          </p>
        )}
    </>
  );
}
