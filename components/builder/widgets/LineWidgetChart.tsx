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
import type { LineWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { formatNumber } from "@/lib/dashlink/utils";

interface Props {
  widget: LineWidget;
  data: Dataset;
}

export default function LineWidgetChart({ widget, data }: Props) {
  const chartData = data.map((row) => ({
    [widget.x]: row[widget.x],
    [widget.y]:
      typeof row[widget.y] === "number"
        ? (row[widget.y] as number)
        : parseFloat(String(row[widget.y] ?? "0")),
  }));

  return (
    <div className="flex h-full flex-col p-4">
      <p className="mb-2 text-xs font-semibold text-zinc-400">{widget.label}</p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
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
            />
            <Line
              type="monotone"
              dataKey={widget.y}
              stroke="#18181b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
