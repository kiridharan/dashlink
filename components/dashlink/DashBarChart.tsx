"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartConfig, Dataset } from "@/lib/dashlink/types";
import { aggregateByField, formatNumber } from "@/lib/dashlink/utils";

interface Props {
  config: ChartConfig;
  data: Dataset;
}

const BAR_COLORS = [
  "#18181b",
  "#52525b",
  "#a1a1aa",
  "#d4d4d8",
  "#71717a",
  "#3f3f46",
];

export default function DashBarChart({ config, data }: Props) {
  // Aggregate repeated x-axis values (e.g. multiple months per region → sum)
  const chartData = aggregateByField(data, config.x, config.y);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500">
        {config.label}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f4f4f5"
            vertical={false}
          />
          <XAxis
            dataKey={config.x}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
            width={52}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e4e4e7",
              boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
              fontSize: 12,
            }}
            formatter={(value) => [formatNumber(Number(value)), config.y]}
            cursor={{ fill: "#f4f4f5" }}
          />
          <Bar dataKey={config.y} radius={[4, 4, 0, 0]}>
            {chartData.map((_row, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
