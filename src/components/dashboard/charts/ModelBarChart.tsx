// src/components/dashboard/charts/ModelBarChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartProps } from '../dashboardConfig';
import { useApp } from '../../../store';
import { applyDashboardFilters } from '../utils';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: { model: string; count: number; percentage: string };
    }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
            <p className="font-semibold text-foreground">{data.model}</p>
            <p className="text-sm text-muted-foreground">
                {data.count} pumps ({data.percentage})
            </p>
        </div>
    );
};

export const ModelBarChart: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    const data = React.useMemo(() => {
        const counts = filteredPumps.reduce((acc, pump) => {
            acc[pump.model] = (acc[pump.model] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const total = filteredPumps.length;
        return Object.entries(counts)
            .map(([model, count]) => ({
                model,
                count,
                percentage: `${((count / total) * 100).toFixed(1)}%`,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 models
    }, [filteredPumps]);

    const handleBarClick = (data: any) => {
        if (onDrilldown && data && data.model) {
            onDrilldown({ modelId: data.model });
        }
    };

    if (data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                        dataKey="model"
                        type="category"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={90}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        onClick={handleBarClick}
                        className="cursor-pointer"
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
