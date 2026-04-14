"use client";

import type { TableWidget } from "@/lib/dashlink/builder-types";
import type { Dataset, DataValue } from "@/lib/dashlink/types";
import { useWidgetTheme } from "@/lib/dashlink/theme-context";

function fmt(v: DataValue): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
}

interface Props {
  widget: TableWidget;
  data: Dataset;
}

export default function TableWidgetView({ widget, data }: Props) {
  const theme = useWidgetTheme();

  if (!data.length) {
    return (
      <div
        className="flex h-full items-center justify-center px-4 text-center text-xs"
        style={{ background: theme.cardBg, color: theme.mutedColor }}
      >
        No rows match the current filters.
      </div>
    );
  }

  const cols = widget.columns ?? Object.keys(data[0]);
  const rows = data.slice(0, 50);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: theme.cardBg }}
    >
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead
            className="sticky top-0"
            style={{ background: theme.tableHeaderBg }}
          >
            <tr>
              {cols.map((c: string) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: theme.tableBorderColor,
                    color: theme.tableHeaderText,
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background:
                    i % 2 === 0 ? theme.tableRowEvenBg : theme.tableRowOddBg,
                }}
              >
                {cols.map((c: string) => (
                  <td
                    key={c}
                    className="whitespace-nowrap border-b px-4 py-2"
                    style={{
                      borderColor: theme.tableBorderColor,
                      color: theme.tableText,
                    }}
                  >
                    {fmt(row[c] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
