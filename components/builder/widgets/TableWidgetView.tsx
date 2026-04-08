import type { TableWidget } from "@/lib/dashlink/builder-types";
import type { Dataset, DataValue } from "@/lib/dashlink/types";

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
  if (!data.length) return null;
  const cols = widget.columns ?? Object.keys(data[0]);
  const rows = data.slice(0, 50);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-50">
            <tr>
              {cols.map((c: string) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b border-zinc-100 px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
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
                className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}
              >
                {cols.map((c: string) => (
                  <td
                    key={c}
                    className="whitespace-nowrap border-b border-zinc-100 px-4 py-2 text-zinc-700"
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
