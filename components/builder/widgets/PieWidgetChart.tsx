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
import { formatLabel, formatNumber } from "@/lib/dashlink/utils";

const COLORS = [
  "#18181b",
  "#3f3f46",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#52525b",
  "#27272a",
  "#e4e4e7",
];

interface Props {
  widget: PieWidget;
  data: Dataset;
}

export default function PieWidgetChart({ widget, data }: Props) {
  // Aggregate: sum value field grouped by category
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
    .slice(0, 8); // cap slices for readability

  return (
    <div className="flex h-full flex-col p-4">
      <p className="mb-2 text-xs font-semibold text-zinc-400">{widget.label}</p>
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
              stroke="#fff"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                fontSize: 11,
              }}
              formatter={(v, name) => [
                formatNumber(Number(v)),
                formatLabel(String(name)),
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, color: "#71717a" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
