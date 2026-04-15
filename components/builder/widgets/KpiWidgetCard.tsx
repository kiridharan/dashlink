"use client";

import type { KpiWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatNumber, formatLabel } from "@/lib/dashlink/utils";
import {
  computeMetric,
  computeKpiWithComparison,
  aggregationSubtitle,
  filterNulls,
} from "@/lib/dashlink/aggregation";

interface Props {
  widget: KpiWidget;
  data: Dataset;
}

export default function KpiWidgetCard({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const effectiveData = widget.hideNulls
    ? filterNulls(data, widget.field)
    : data;

  if (widget.compareEnabled && effectiveData.length >= 2) {
    const comparison = computeKpiWithComparison(
      effectiveData,
      widget.field,
      widget.metric,
    );
    const formatted = formatNumber(comparison.current);
    const subtitle = aggregationSubtitle({
      metric: widget.metric,
      valueField: widget.field,
    });
    const isPositive = comparison.delta >= 0;
    const deltaSign = isPositive ? "+" : "";
    const deltaText = `${deltaSign}${formatNumber(comparison.delta)}`;
    const percentText =
      comparison.deltaPercent !== null
        ? ` (${deltaSign}${comparison.deltaPercent.toFixed(1)}%)`
        : "";

    return (
      <div
        className="flex h-full flex-col justify-between p-5"
        style={{ background: theme.cardBg }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: theme.mutedColor }}
        >
          {formatLabel(widget.field)}
        </p>
        <p className="text-[10px]" style={{ color: theme.mutedColor }}>
          {subtitle}
        </p>
        <p
          className="text-3xl font-bold tracking-tight"
          style={{ color: theme.kpiValueColor }}
        >
          {formatted}
        </p>
        <p
          className="text-xs font-medium"
          style={{ color: isPositive ? "#16a34a" : "#dc2626" }}
        >
          {deltaText}
          {percentText}
          <span
            className="ml-1 font-normal"
            style={{ color: theme.mutedColor }}
          >
            vs prev. period
          </span>
        </p>
      </div>
    );
  }

  const total = computeMetric(effectiveData, widget.field, widget.metric);
  const formatted = formatNumber(total);
  const subtitle = aggregationSubtitle({
    metric: widget.metric,
    valueField: widget.field,
  });

  return (
    <div
      className="flex h-full flex-col justify-between p-5"
      style={{ background: theme.cardBg }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: theme.mutedColor }}
      >
        {formatLabel(widget.field)}
      </p>
      <p className="text-[10px]" style={{ color: theme.mutedColor }}>
        {subtitle}
      </p>
      <p
        className="text-3xl font-bold tracking-tight"
        style={{ color: theme.kpiValueColor }}
      >
        {formatted}
      </p>
    </div>
  );
}
