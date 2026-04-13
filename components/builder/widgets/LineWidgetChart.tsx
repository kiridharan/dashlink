"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LineWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatNumber } from "@/lib/dashlink/utils";
import {
  aggregateLineSeries,
  aggregationSubtitle,
  buildLineSeries,
} from "@/lib/dashlink/aggregation";

interface Props {
  widget: LineWidget;
  data: Dataset;
}

export default function LineWidgetChart({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const cs = theme.chart;

  const shouldAggregate = widget.metric !== undefined || !!widget.timeGrain;
  const chartData = shouldAggregate
    ? aggregateLineSeries(data, widget.x, widget.y, {
        metric: widget.metric,
        timeGrain: widget.timeGrain,
      })
    : buildLineSeries(data, widget.x, widget.y);
  const subtitle = aggregationSubtitle({
    metric: widget.metric,
    valueField: widget.y,
    groupField: widget.x,
    timeGrain: widget.timeGrain,
  });

  const tooltipStyle = {
    borderRadius: cs.tooltipRadius,
    border: `1px solid ${theme.tooltipBorderColor}`,
    background: theme.tooltipBg,
    fontSize: 11,
    color: theme.titleColor,
  };

  const commonAxisProps = {
    tickLine: false as const,
    axisLine: false as const,
  };

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
          {cs.lineArea ? (
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              {cs.showGrid && (
                <CartesianGrid
                  strokeDasharray={cs.gridDash}
                  stroke={theme.gridLineColor}
                />
              )}
              <XAxis
                dataKey={widget.x}
                tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
                {...commonAxisProps}
              />
              <YAxis
                tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
                tickFormatter={(v: number) => formatNumber(v)}
                width={44}
                {...commonAxisProps}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [formatNumber(Number(v)), widget.y]}
              />
              <Area
                type={cs.lineType}
                dataKey={widget.y}
                stroke={theme.chartColors[0]}
                strokeWidth={cs.lineStrokeWidth}
                fill={theme.chartColors[0]}
                fillOpacity={cs.lineAreaOpacity}
                dot={
                  cs.lineDot
                    ? { r: cs.lineDotRadius, fill: theme.chartColors[0] }
                    : false
                }
                activeDot={{
                  r: cs.lineDotRadius + 1,
                  fill: theme.chartColors[0],
                }}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              {cs.showGrid && (
                <CartesianGrid
                  strokeDasharray={cs.gridDash}
                  stroke={theme.gridLineColor}
                />
              )}
              <XAxis
                dataKey={widget.x}
                tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
                {...commonAxisProps}
              />
              <YAxis
                tick={{ fontSize: cs.axisLabelSize, fill: theme.axisTickColor }}
                tickFormatter={(v: number) => formatNumber(v)}
                width={44}
                {...commonAxisProps}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [formatNumber(Number(v)), widget.y]}
              />
              <Line
                type={cs.lineType}
                dataKey={widget.y}
                stroke={theme.chartColors[0]}
                strokeWidth={cs.lineStrokeWidth}
                dot={
                  cs.lineDot
                    ? { r: cs.lineDotRadius, fill: theme.chartColors[0] }
                    : false
                }
                activeDot={{
                  r: cs.lineDotRadius + 1,
                  fill: theme.chartColors[0],
                }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
