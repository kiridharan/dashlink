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

interface Props {
  widget: PieWidget;
  data: Dataset;
}

export default function PieWidgetChart({ widget, data }: Props) {
  const theme = useWidgetTheme();
  const cs = theme.chart;

  const groups = new Map<string, number>();
  for (const row of data) {
    const key = String(row[widget.category] ?? "(unknown)");
    const raw = row[widget.value];
    const val = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
    if (!isNaN(val)) {
      groups.set(key, (groups.get(key) ?? 0) + val);
    }
  }

  const chartData = Array.from(groups.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

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
