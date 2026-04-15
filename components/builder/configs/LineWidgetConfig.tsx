"use client";

import type {
  AggregationMetric,
  DashWidget,
  LineWidget,
  TimeGrain,
} from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import type { FieldKind } from "./shared";
import {
  SectionLabel,
  FieldRow,
  Toggle,
  SEL,
  ALL_METRICS,
  TIME_GRAIN_OPTIONS,
  FISCAL_MONTHS,
  getIntelligentMetrics,
  metricFieldOptions,
} from "./shared";

interface Props {
  widget: LineWidget;
  data: Dataset;
  all: string[];
  numeric: string[];
  kindByField: Record<string, FieldKind>;
  onUpdate: (patch: Partial<DashWidget>) => void;
}

export default function LineWidgetConfig({
  widget,
  all,
  numeric,
  kindByField,
  onUpdate,
}: Props) {
  return (
    <>
      <SectionLabel>Data</SectionLabel>
      <FieldRow label="X-Axis (Group)" title="Axis or grouping field">
        <select
          className={SEL}
          value={widget.x}
          onChange={(e) => {
            const nextX = e.target.value;
            const patch: Partial<DashWidget> = { x: nextX };
            if (kindByField[nextX] !== "date") {
              (patch as Record<string, unknown>).timeGrain = undefined;
            }
            onUpdate(patch);
          }}
        >
          {all.map((f) => (
            <option key={f} value={f}>
              {f}{" "}
              {kindByField[f] === "date"
                ? "📅"
                : kindByField[f] === "numeric"
                  ? "123"
                  : ""}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Y-Axis (Value)" title="Field to measure">
        <select
          className={SEL}
          value={widget.y}
          onChange={(e) =>
            onUpdate({ y: e.target.value } as Partial<DashWidget>)
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
          {getIntelligentMetrics(kindByField[widget.y]).map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[9px] text-zinc-400">
          {ALL_METRICS.find((m) => m.value === (widget.metric ?? "sum"))?.help}
        </p>
      </FieldRow>

      {kindByField[widget.x] === "date" && (
        <FieldRow label="Time Grain" title="Bucket dates into periods">
          <select
            className={SEL}
            value={widget.timeGrain ?? ""}
            onChange={(e) =>
              onUpdate({
                timeGrain: (e.target.value || undefined) as
                  | TimeGrain
                  | undefined,
              } as Partial<DashWidget>)
            }
          >
            <option value="">None</option>
            {TIME_GRAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
      )}

      {widget.timeGrain &&
        (widget.timeGrain === "year" || widget.timeGrain === "quarter") && (
          <FieldRow
            label="Fiscal Year Start"
            title="Month that starts the fiscal year (1=Jan, 4=Apr, etc.)"
          >
            <select
              className={SEL}
              value={widget.customDateRange?.startMonth ?? 1}
              onChange={(e) => {
                const month = Number(e.target.value);
                onUpdate({
                  customDateRange:
                    month === 1 ? undefined : { startMonth: month },
                } as Partial<DashWidget>);
              }}
            >
              {FISCAL_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[9px] text-zinc-400">
              Calendar year when set to January.
            </p>
          </FieldRow>
        )}

      <SectionLabel>Multi-group</SectionLabel>
      <FieldRow label="Second Group" title="Add a second grouping dimension">
        <select
          className={SEL}
          value={widget.secondGroupBy ?? ""}
          onChange={(e) =>
            onUpdate({
              secondGroupBy: e.target.value || undefined,
            } as Partial<DashWidget>)
          }
        >
          <option value="">None</option>
          {all
            .filter((f) => f !== widget.x)
            .map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
        </select>
      </FieldRow>

      <SectionLabel>Options</SectionLabel>
      <Toggle
        checked={widget.hideNulls ?? false}
        onChange={(v) => onUpdate({ hideNulls: v } as Partial<DashWidget>)}
        label="Hide null values"
        title="Exclude null/empty values"
      />
    </>
  );
}
