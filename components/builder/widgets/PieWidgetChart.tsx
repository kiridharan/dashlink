"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatLabel, formatNumber } from "@/lib/dashlink/utils";
import {
  aggregateByGroup,
  aggregationSubtitle,
} from "@/lib/dashlink/aggregation";

interface Props {
  widget: PieWidget;
  data: Dataset;
}

export default function PieWidgetChart({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const cs = theme.chart;

  const metricRows = aggregateByGroup(data, widget.category, widget.value, {
    metric: widget.metric,
    sort: widget.sort,
    topN: widget.topN ?? 8,
    showOtherBucket: widget.showOtherBucket,
    hideNulls: widget.hideNulls,
  });
  const chartData = metricRows.map((row) => ({
    name: String(row[widget.category] ?? "(unknown)"),
    value: Number(row[widget.value] ?? 0),
  }));
  const subtitle = aggregationSubtitle({
    metric: widget.metric,
    valueField: widget.value,
    groupField: widget.category,
  });

  return (
    <div
      className="flex h-full flex-col p-4"
      style={{ background: theme.cardBg }}
    >
      <p
        className="mb-2 text-xs font-semibold"
        style={{ color: theme.mutedColor, fontSize: cs.axisLabelSize }}
      >
        {widget.label}
      </p>
      <p
        className="-mt-1 mb-2 text-[10px]"
        style={{ color: theme.mutedColor, fontSize: cs.axisLabelSize }}
      >
        {subtitle}
      </p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              strokeWidth={2}
              stroke={theme.cardBg}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={theme.chartColors[i % theme.chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: cs.tooltipRadius,
                border: `1px solid ${theme.tooltipBorderColor}`,
                background: theme.tooltipBg,
                fontSize: 11,
                color: theme.titleColor,
              }}
              formatter={(v, name) => [
                formatNumber(Number(v)),
                formatLabel(String(name)),
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: cs.axisLabelSize,
                color: theme.mutedColor,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
