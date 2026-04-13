"use client";

import type { KpiWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatNumber, formatLabel } from "@/lib/dashlink/utils";
import { computeMetric, aggregationSubtitle } from "@/lib/dashlink/aggregation";

interface Props {
  widget: KpiWidget;
  data: Dataset;
}

export default function KpiWidgetCard({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const total = computeMetric(data, widget.field, widget.metric);
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
