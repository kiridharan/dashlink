"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { BarWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { aggregateByField, formatNumber } from "@/lib/dashlink/utils";

interface Props {
  widget: BarWidget;
  data: Dataset;
}

export default function BarWidgetChart({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const cs = theme.chart;
  const chartData = aggregateByField(data, widget.x, widget.y);

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
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            barSize={cs.barMaxWidth}
          >
            {cs.showGrid && (
              <CartesianGrid
                strokeDasharray={cs.gridDash}
                stroke={theme.gridLineColor}
                vertical={false}
              />
            )}
            <XAxis
              dataKey={widget.x}
              tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
              width={44}
            />
            <Tooltip
              contentStyle={{
                borderRadius: cs.tooltipRadius,
                border: `1px solid ${theme.tooltipBorderColor}`,
                background: theme.tooltipBg,
                fontSize: 11,
                color: theme.titleColor,
              }}
              formatter={(v) => [formatNumber(Number(v)), widget.y]}
              cursor={{ fill: theme.gridLineColor }}
            />
            <Bar dataKey={widget.y} radius={cs.barRadius}>
              {chartData.map((_row, i) => (
                <Cell
                  key={i}
                  fill={theme.chartColors[i % theme.chartColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
