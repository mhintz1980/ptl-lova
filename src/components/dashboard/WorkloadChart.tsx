// src/components/dashboard/WorkloadChart.tsx
import React, { useState } from "react";
import { Pump } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";

interface WorkloadChartProps {
  pumps: Pump[];
  type: 'customer' | 'model';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
    };
    value: number;
  }>;
  type: 'customer' | 'model';
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

const CustomTooltip = ({ active, payload, type }: TooltipProps) => {
  if (active && payload && payload[0]) {
    return (
      <div className="bg-popover border border-border rounded-md shadow-lg p-2">
        <p className="text-sm font-medium">{payload[0].payload.name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} {type === 'customer' ? 'pumps' : 'units'}
        </p>
      </div>
    );
  }
  return null;
};

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ pumps, type }) => {
  const data = React.useMemo(() => buildCounts(pumps, type), [pumps, type]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

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

  const renderActiveLabel = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    const radius = outerRadius + 40;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g className="animate-scale-in">
        <text
          x={x}
          y={y}
          fill="hsl(var(--foreground))"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="font-semibold text-sm animate-fade-in"
        >
          {name}
        </text>
        <text
          x={x}
          y={y + 16}
          fill="hsl(var(--muted-foreground))"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-xs animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          {value} {type === 'customer' ? 'pumps' : 'units'}
        </text>
      </g>
    );
  };

  return (
    <Card className="layer-l1 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">
            Workload by {type === 'customer' ? 'Customer' : 'Model'}
          </CardTitle>
        </CardHeader>
        <CardContent className="transition-transform duration-300 hover:translate-y-[-4px]">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                animationBegin={0}
                animationDuration={800}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                activeShape={(props: any) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                  return (
                    <g className="transition-all duration-200">
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 8}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        style={{
                          filter: 'drop-shadow(0 0 12px currentColor) brightness(1.2)',
                          color: fill,
                        }}
                      />
                    </g>
                  );
                }}
                label={activeIndex !== undefined ? renderActiveLabel : false}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getChartColor(index)}
                    stroke="hsl(var(--background))"
                    strokeWidth={1}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
                wrapperStyle={{
                  transition: 'transform 0.3s ease',
                  transform: activeIndex !== undefined ? 'translateY(4px)' : 'translateY(0)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
  );
};
