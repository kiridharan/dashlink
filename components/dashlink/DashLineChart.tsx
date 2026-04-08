"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig, Dataset } from "@/lib/dashlink/types";
import { formatNumber } from "@/lib/dashlink/utils";

interface Props {
  config: ChartConfig;
  data: Dataset;
}

export default function DashLineChart({ config, data }: Props) {
  const chartData = data.map((row) => ({
    [config.x]: row[config.x],
    [config.y]:
      typeof row[config.y] === "number"
        ? (row[config.y] as number)
        : parseFloat(String(row[config.y] ?? "0")),
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500">
        {config.label}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
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
          />
          <Line
            type="monotone"
            dataKey={config.y}
            stroke="#18181b"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#18181b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
