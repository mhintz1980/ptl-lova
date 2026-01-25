import type { ChartProps } from "../../../dashboard/config";
import { getLateOrders } from "./filtering";
import { formatDate } from "../../../lib/format";

const clearPayload = {
  stage: undefined,
  customerId: undefined,
  modelId: undefined,
  department: undefined,
  dateRange: { from: null, to: null },
};

export function LateOrdersChart({ pumps, filters, onDrilldown }: ChartProps) {
  const late = getLateOrders(pumps, filters);

  return (
    <div className="space-y-3" aria-label="Late orders chart">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {late.length} late {late.length === 1 ? "order" : "orders"}
        </p>
        <button
          type="button"
          className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          onClick={() => onDrilldown(clearPayload)}
        >
          Clear filters
        </button>
      </div>
      <div className="space-y-2 max-h-52 overflow-auto pr-1 scrollbar-thin">
        {late.map((pump) => (
          <div
            key={pump.id}
            className="rounded-xl border border-border/60 bg-card/60 p-3 text-sm"
            role="button"
            tabIndex={0}
            onClick={() => onDrilldown({ customerId: pump.customer })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onDrilldown({ customerId: pump.customer });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{pump.po}</span>
              <span className="text-xs text-destructive">
                {formatDate(pump.promiseDate)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {pump.customer} · {pump.stage}
            </div>
          </div>
        ))}
        {!late.length && (
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            All orders are on schedule.
          </div>
        )}
      </div>
    </div>
  );
}
