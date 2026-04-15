"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BarWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";
import { formatNumber } from "@/lib/dashlink/utils";
import {
  aggregateByGroup,
  aggregateByMultipleGroups,
  aggregationSubtitle,
} from "@/lib/dashlink/aggregation";

interface Props {
  widget: BarWidget;
  data: Dataset;
}

export default function BarWidgetChart({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const cs = theme.chart;

  const hasSecondGroup = !!widget.secondGroupBy;

  // Single group path
  const singleGroupData = useMemo(() => {
    if (hasSecondGroup) return [];
    return aggregateByGroup(data, widget.x, widget.y, {
      metric: widget.metric,
      sort: widget.sort,
      topN: widget.topN,
      showOtherBucket: widget.showOtherBucket,
      hideNulls: widget.hideNulls,
    });
  }, [data, widget, hasSecondGroup]);

  // Multi group path: pivot data so each primary group is a row
  // with columns for each secondary group value
  const { pivotedData, secondGroupKeys } = useMemo(() => {
    if (!hasSecondGroup)
      return { pivotedData: [] as Dataset, secondGroupKeys: [] as string[] };

    const raw = aggregateByMultipleGroups(
      data,
      widget.x,
      widget.secondGroupBy!,
      widget.y,
      { metric: widget.metric, hideNulls: widget.hideNulls },
    );

    // Collect unique secondary group values
    const sgKeys = Array.from(
      new Set(raw.map((r) => String(r[widget.secondGroupBy!] ?? "(empty)"))),
    );

    // Pivot: one row per primary group, columns = secondary group values
    const byPrimary = new Map<string, Record<string, unknown>>();
    for (const row of raw) {
      const pk = String(row[widget.x] ?? "(empty)");
      const sk = String(row[widget.secondGroupBy!] ?? "(empty)");
      if (!byPrimary.has(pk)) {
        byPrimary.set(pk, { [widget.x]: pk });
      }
      byPrimary.get(pk)![sk] = row[widget.y];
    }

    return {
      pivotedData: Array.from(byPrimary.values()),
      secondGroupKeys: sgKeys,
    };
  }, [data, widget, hasSecondGroup]);

  const chartData = hasSecondGroup ? pivotedData : singleGroupData;

  const subtitle = aggregationSubtitle({
    metric: widget.metric,
    valueField: widget.y,
    groupField: widget.x,
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
              formatter={(v) => [formatNumber(Number(v)), ""]}
              cursor={{ fill: theme.gridLineColor }}
            />
            {hasSecondGroup ? (
              <>
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                {secondGroupKeys.map((sk, i) => (
                  <Bar
                    key={sk}
                    dataKey={sk}
                    stackId="stack"
                    fill={theme.chartColors[i % theme.chartColors.length]}
                    radius={
                      i === secondGroupKeys.length - 1
                        ? (cs.barRadius as [number, number, number, number])
                        : undefined
                    }
                  />
                ))}
              </>
            ) : (
              <Bar dataKey={widget.y} radius={cs.barRadius}>
                {chartData.map((_row, i) => (
                  <Cell
                    key={i}
                    fill={theme.chartColors[i % theme.chartColors.length]}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
