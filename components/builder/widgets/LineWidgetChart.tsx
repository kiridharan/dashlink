"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LineWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatNumber } from "@/lib/dashlink/utils";
import {
  aggregateLineSeries,
  aggregateByMultipleGroups,
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

  const hasSecondGroup = !!widget.secondGroupBy;

  // Single group path
  const singleGroupData = useMemo(() => {
    if (hasSecondGroup) return [];
    const shouldAggregate = widget.metric !== undefined || !!widget.timeGrain;
    return shouldAggregate
      ? aggregateLineSeries(data, widget.x, widget.y, {
          metric: widget.metric,
          timeGrain: widget.timeGrain,
          hideNulls: widget.hideNulls,
          fiscalStartMonth: widget.customDateRange?.startMonth,
        })
      : buildLineSeries(data, widget.x, widget.y);
  }, [data, widget, hasSecondGroup]);

  // Multi group path: pivot to { x, series1, series2, ... }
  const { pivotedData, seriesKeys } = useMemo(() => {
    if (!hasSecondGroup)
      return { pivotedData: [] as Dataset, seriesKeys: [] as string[] };

    const raw = aggregateByMultipleGroups(
      data,
      widget.x,
      widget.secondGroupBy!,
      widget.y,
      { metric: widget.metric, hideNulls: widget.hideNulls },
    );

    const sKeys = Array.from(
      new Set(raw.map((r) => String(r[widget.secondGroupBy!] ?? "(empty)"))),
    );

    const byX = new Map<string, Record<string, unknown>>();
    for (const row of raw) {
      const xk = String(row[widget.x] ?? "(empty)");
      const sk = String(row[widget.secondGroupBy!] ?? "(empty)");
      if (!byX.has(xk)) byX.set(xk, { [widget.x]: xk });
      byX.get(xk)![sk] = row[widget.y];
    }

    return { pivotedData: Array.from(byX.values()), seriesKeys: sKeys };
  }, [data, widget, hasSecondGroup]);

  const chartData = hasSecondGroup ? pivotedData : singleGroupData;

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
          {cs.lineArea && !hasSecondGroup ? (
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
                formatter={(v) => [formatNumber(Number(v)), ""]}
              />
              {hasSecondGroup ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                  {seriesKeys.map((sk, i) => (
                    <Line
                      key={sk}
                      type={cs.lineType}
                      dataKey={sk}
                      name={sk}
                      stroke={theme.chartColors[i % theme.chartColors.length]}
                      strokeWidth={cs.lineStrokeWidth}
                      dot={
                        cs.lineDot
                          ? {
                              r: cs.lineDotRadius,
                              fill: theme.chartColors[
                                i % theme.chartColors.length
                              ],
                            }
                          : false
                      }
                    />
                  ))}
                </>
              ) : (
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
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
