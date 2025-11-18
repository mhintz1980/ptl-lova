// src/components/dashboard/WorkloadChart.tsx
import React from "react";
import { Pump } from "../../types";
import { HoverAnimatedPieChart } from "../charts/HoverAnimatedPieChart";

interface WorkloadChartProps {
  pumps: Pump[];
  type: "customer" | "model";
}

const buildCounts = (pumps: Pump[], type: 'customer' | 'model') => {
  const counts = pumps.reduce((acc, pump) => {
    const key = type === 'customer' ? pump.customer : pump.model;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 for better visualization
};

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ pumps, type }) => {
  const data = React.useMemo(() => buildCounts(pumps, type), [pumps, type]);

  const getChartColor = (index: number) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    return colors[index % colors.length];
  };

  return (
    <HoverAnimatedPieChart
      data={data}
      dataKey="value"
      nameKey="name"
      colors={data.map((_, index) => getChartColor(index))}
      title={`Workload by ${type === 'customer' ? 'Customer' : 'Model'}`}
      subtitle="Top 8 segments (hover for details)"
      valueFormatter={(value) =>
        `${value} ${type === "customer" ? "pumps" : "units"}`
      }
    />
  );
};
