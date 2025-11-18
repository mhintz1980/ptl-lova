// src/components/dashboard/ValueChart.tsx
import React from "react";
import { Pump } from "../../types";
import { HoverAnimatedPieChart } from "../charts/HoverAnimatedPieChart";

interface ValueChartProps {
  pumps: Pump[];
  type: "customer" | "model";
}

const aggregatePoValue = (pumps: Pump[], type: 'customer' | 'model') => {
  const groups = pumps.reduce((acc, pump) => {
    const key = type === 'customer' ? pump.customer : pump.model;
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += pump.value;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 for better visualization
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ValueChart: React.FC<ValueChartProps> = ({ pumps, type }) => {
  const data = React.useMemo(() => aggregatePoValue(pumps, type), [pumps, type]);

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <HoverAnimatedPieChart
      data={data}
      dataKey="value"
      nameKey="name"
      colors={data.map((_, idx) => colors[idx % colors.length])}
      title={`Value by ${type === "customer" ? "Customer" : "Model"}`}
      subtitle="Top 8 combined PO values"
      valueFormatter={(value) => formatCurrency(value)}
    />
  );
};
