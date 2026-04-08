import type { DashboardConfig, Dataset } from "@/lib/dashlink/types";
import { formatLabel, formatNumber, sumField } from "@/lib/dashlink/utils";
import KpiCard from "./KpiCard";
import DashLineChart from "./DashLineChart";
import DashBarChart from "./DashBarChart";
import DataTable from "./DataTable";

interface Props {
  config: DashboardConfig;
  data: Dataset;
}

export default function DashboardRenderer({ config, data }: Props) {
  // Compute KPI summaries (sum each numeric KPI field across all rows)
  const kpis = config.kpis.map((field: string) => {
    const total = sumField(data, field);
    return {
      field,
      label: `Total ${formatLabel(field)}`,
      value: total,
      formatted: formatNumber(total),
    };
  });

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      {kpis.length > 0 && (
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.map(
              (kpi: {
                field: string;
                label: string;
                value: number;
                formatted: string;
              }) => (
                <KpiCard key={kpi.field} {...kpi} />
              ),
            )}
          </div>
        </section>
      )}

      {/* Charts */}
      {config.charts.length > 0 && (
        <section>
          <div
            className={
              config.charts.length === 1
                ? "grid grid-cols-1"
                : "grid grid-cols-1 gap-6 lg:grid-cols-2"
            }
          >
            {config.charts.map(
              (chart: import("@/lib/dashlink/types").ChartConfig, i: number) =>
                chart.type === "line" ? (
                  <DashLineChart key={i} config={chart} data={data} />
                ) : (
                  <DashBarChart key={i} config={chart} data={data} />
                ),
            )}
          </div>
        </section>
      )}

      {/* Table */}
      {config.showTable && (
        <section>
          <DataTable data={data} />
        </section>
      )}

      {/* Empty state */}
      {kpis.length === 0 && config.charts.length === 0 && !config.showTable && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-24 text-center">
          <p className="text-zinc-400">No visualisable data found.</p>
          <p className="mt-1 text-sm text-zinc-300">
            The API response could not be mapped to any chart type.
          </p>
        </div>
      )}
    </div>
  );
}
