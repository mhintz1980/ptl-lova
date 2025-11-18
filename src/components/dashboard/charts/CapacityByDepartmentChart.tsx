import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { ChartProps } from "../../../dashboard/config";
import {
  DEPARTMENTS,
  groupByDepartment,
} from "./filtering";

const COLORS: Record<string, string> = {
  Fabrication: "hsl(var(--chart-1))",
  "Powder Coat": "hsl(var(--chart-2))",
  Assembly: "hsl(var(--chart-3))",
  "Testing & Shipping": "hsl(var(--chart-4))",
};

export function CapacityByDepartmentChart({
  pumps,
  filters,
  onDrilldown,
}: ChartProps) {
  const data = groupByDepartment(pumps, filters);

  return (
    <div className="space-y-3" aria-label="Capacity by department chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 8, right: 8 }}>
          <XAxis dataKey="department" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={entry.department}
                fill={COLORS[entry.department] || "hsl(var(--primary))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((department) => (
          <button
            key={department}
            type="button"
            data-testid={`department-chip-${department}`}
            className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            onClick={() => onDrilldown({ department })}
          >
            {department} · {data.find((d) => d.department === department)?.value ?? 0}
          </button>
        ))}
      </div>
    </div>
  );
}
