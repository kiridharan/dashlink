import type { KpiWidget } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { sumField, formatNumber, formatLabel } from "@/lib/dashlink/utils";

interface Props {
  widget: KpiWidget;
  data: Dataset;
}

export default function KpiWidgetCard({ widget, data }: Props) {
  const total = sumField(data, widget.field);
  const formatted = formatNumber(total);

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        {formatLabel(widget.field)}
      </p>
      <p className="text-3xl font-bold tracking-tight text-zinc-900">
        {formatted}
      </p>
    </div>
  );
}
