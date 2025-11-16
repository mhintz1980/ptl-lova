// src/components/dashboard/ValueChart.tsx
import React from "react";
import { Pump } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ValueChartProps {
  pumps: Pump[];
  type: 'customer' | 'model';
}

interface ValueTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
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

const CustomTooltip = ({ active, payload, label }: ValueTooltipProps) => {
  if (active && payload && payload[0]) {
    return (
      <div className="bg-popover border border-border rounded-md shadow-lg p-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const ValueChart: React.FC<ValueChartProps> = ({ pumps, type }) => {
  const data = React.useMemo(() => aggregatePoValue(pumps, type), [pumps, type]);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

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
    <Card className="layer-l1 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">
            Value by {type === 'customer' ? 'Customer' : 'Model'}
          </CardTitle>
        </CardHeader>
        <CardContent className="transition-transform duration-300 hover:translate-y-[-4px]">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 0, right: 0, left: 0, bottom: 60 }}
              onMouseMove={(state) => {
                if (state.isTooltipActive && typeof state.activeTooltipIndex === 'number') {
                  setHoveredIndex(state.activeTooltipIndex);
                } else {
                  setHoveredIndex(null);
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getChartColor(index)}
                    style={{
                      filter: hoveredIndex === index ? 'drop-shadow(0 0 8px currentColor) brightness(1.2)' : 'none',
                      transform: hoveredIndex === index ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
  );
};