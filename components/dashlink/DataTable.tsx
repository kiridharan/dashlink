import type { Dataset, DataValue } from "@/lib/dashlink/types";

interface Props {
  data: Dataset;
  /** Subset of columns to show; defaults to all keys in first row */
  columns?: string[];
}

function formatCell(value: DataValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return String(value);
}

export default function DataTable({ data, columns }: Props) {
  if (!data.length) return null;

  const cols = columns ?? Object.keys(data[0]);
  const rows = data.slice(0, 100); // guard against huge sets

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-zinc-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-zinc-500">Raw Data</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Showing {rows.length} of {data.length} rows
        </p>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-left">
            <tr>
              {cols.map((col) => (
                <th
                  key={col}
                  className="border-b border-zinc-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(
              (row: import("@/lib/dashlink/types").DataRow, i: number) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/60"}
                >
                  {cols.map((col: string) => (
                    <td
                      key={col}
                      className="border-b border-zinc-100 px-6 py-3 text-zinc-700 whitespace-nowrap"
                    >
                      {formatCell(row[col] ?? null)}
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
