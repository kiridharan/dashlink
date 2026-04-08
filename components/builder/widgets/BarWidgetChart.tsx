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
import { aggregateByField, formatNumber } from "@/lib/dashlink/utils";

const COLORS = [
  "#18181b",
  "#52525b",
  "#a1a1aa",
  "#d4d4d8",
  "#71717a",
  "#3f3f46",
];

interface Props {
  widget: BarWidget;
  data: Dataset;
}

export default function BarWidgetChart({ widget, data }: Props) {
  const chartData = aggregateByField(data, widget.x, widget.y);

  return (
    <div className="flex h-full flex-col p-4">
      <p className="mb-2 text-xs font-semibold text-zinc-400">{widget.label}</p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f4f4f5"
              vertical={false}
            />
            <XAxis
              dataKey={widget.x}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
              width={44}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                fontSize: 11,
              }}
              formatter={(v) => [formatNumber(Number(v)), widget.y]}
              cursor={{ fill: "#f4f4f5" }}
            />
            <Bar dataKey={widget.y} radius={[3, 3, 0, 0]}>
              {chartData.map((_row, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
