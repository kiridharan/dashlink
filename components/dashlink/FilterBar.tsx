"use client";

import { useMemo } from "react";
import type {
  FilterControl,
  FilterState,
  FilterValue,
} from "@/lib/dashlink/builder-types";
import {
  activeFilterCount,
  controlLabel,
  defaultValueFor,
  getFieldNumericRange,
  getFieldValueOptions,
} from "@/lib/dashlink/filters";
import type { Dataset } from "@/lib/dashlink/types";

interface ThemeTokens {
  cardBg?: string;
  border?: string;
  text?: string;
  muted?: string;
}

interface Props {
  controls: FilterControl[];
  state: FilterState;
  data: Dataset;
  onChange: (controlId: string, value: FilterValue) => void;
  onClear?: () => void;
  variant?: "viewer" | "builder";
  tokens?: ThemeTokens;
}

export default function FilterBar({
  controls,
  state,
  data,
  onChange,
  onClear,
  variant = "viewer",
  tokens,
}: Props) {
  const activeCount = useMemo(
    () => activeFilterCount(controls, state),
    [controls, state],
  );

  if (controls.length === 0) return null;

  const styles: React.CSSProperties = {
    background: tokens?.cardBg,
    borderColor: tokens?.border,
    color: tokens?.text,
  };

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3"
      style={styles}
    >
      {controls.map((control) => {
        const value = state[control.id] ?? defaultValueFor(control);
        return (
          <FilterControlInput
            key={control.id}
            control={control}
            value={value}
            data={data}
            onChange={(v) => onChange(control.id, v)}
            mutedColor={tokens?.muted}
          />
        );
      })}

      {onClear && activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
        >
          Clear filters ({activeCount})
        </button>
      )}

      {variant === "builder" && activeCount === 0 && (
        <span className="ml-auto text-[11px] text-zinc-400">
          Live preview — values reset on save
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-control input renderer
// ---------------------------------------------------------------------------

interface InputProps {
  control: FilterControl;
  value: FilterValue;
  data: Dataset;
  onChange: (value: FilterValue) => void;
  mutedColor?: string;
}

function FilterControlInput({
  control,
  value,
  data,
  onChange,
  mutedColor,
}: InputProps) {
  const label = controlLabel(control);
  const labelStyle: React.CSSProperties = { color: mutedColor };

  switch (control.type) {
    case "select": {
      const options =
        value.type === "select"
          ? getFieldValueOptions(data, control.field)
          : [];
      return (
        <Field label={label} labelStyle={labelStyle}>
          <select
            value={value.type === "select" ? (value.value ?? "") : ""}
            onChange={(e) =>
              onChange({
                type: "select",
                value: e.target.value === "" ? null : e.target.value,
              })
            }
            className="min-w-40 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
          >
            <option value="">All</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    case "multiSelect": {
      const options = getFieldValueOptions(data, control.field);
      const selected =
        value.type === "multiSelect" ? new Set(value.values) : new Set();
      return (
        <Field label={label} labelStyle={labelStyle}>
          <details className="relative">
            <summary className="min-w-40 cursor-pointer list-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none hover:border-zinc-400">
              {selected.size === 0 ? "Any" : `${selected.size} selected`}
            </summary>
            <div className="absolute z-20 mt-1 max-h-64 w-56 overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
              {options.length === 0 && (
                <p className="px-1 py-2 text-xs text-zinc-400">No values</p>
              )}
              {options.map((opt) => {
                const checked = selected.has(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(opt);
                        else next.delete(opt);
                        onChange({
                          type: "multiSelect",
                          values: Array.from(next) as string[],
                        });
                      }}
                    />
                    <span className="truncate">{opt}</span>
                  </label>
                );
              })}
            </div>
          </details>
        </Field>
      );
    }

    case "dateRange": {
      const v = value.type === "dateRange" ? value : { from: null, to: null };
      return (
        <Field label={label} labelStyle={labelStyle}>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={v.from ?? ""}
              onChange={(e) =>
                onChange({
                  type: "dateRange",
                  from: e.target.value || null,
                  to: v.to,
                })
              }
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
            />
            <span className="text-xs text-zinc-400">→</span>
            <input
              type="date"
              value={v.to ?? ""}
              onChange={(e) =>
                onChange({
                  type: "dateRange",
                  from: v.from,
                  to: e.target.value || null,
                })
              }
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
            />
          </div>
        </Field>
      );
    }

    case "numberRange": {
      const range = getFieldNumericRange(data, control.field);
      const v = value.type === "numberRange" ? value : { min: null, max: null };
      return (
        <Field label={label} labelStyle={labelStyle}>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={v.min ?? ""}
              placeholder={range ? String(range.min) : "min"}
              onChange={(e) =>
                onChange({
                  type: "numberRange",
                  min: e.target.value === "" ? null : Number(e.target.value),
                  max: v.max,
                })
              }
              className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
            />
            <span className="text-xs text-zinc-400">–</span>
            <input
              type="number"
              value={v.max ?? ""}
              placeholder={range ? String(range.max) : "max"}
              onChange={(e) =>
                onChange({
                  type: "numberRange",
                  min: v.min,
                  max: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
            />
          </div>
        </Field>
      );
    }

    case "search": {
      const query = value.type === "search" ? value.query : "";
      return (
        <Field label={label} labelStyle={labelStyle}>
          <input
            type="search"
            value={query}
            placeholder="Type to search…"
            onChange={(e) =>
              onChange({ type: "search", query: e.target.value })
            }
            className="min-w-56 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
          />
        </Field>
      );
    }

    default:
      return null;
  }
}

function Field({
  label,
  labelStyle,
  children,
}: {
  label: string;
  labelStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500"
        style={labelStyle}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
