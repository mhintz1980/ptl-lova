// src/components/dashboard/charts/ValueByModelChart.tsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartProps } from '../dashboardConfig';
import { useApp } from '../../../store';
import { applyDashboardFilters } from '../utils';
import { DollarSign } from 'lucide-react';

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
        color: string;
        dataKey: string;
    }>;
    label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const total = payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
        <div className="rounded-lg border-2 border-border bg-background/95 backdrop-blur-sm p-4 shadow-xl">
            <p className="font-bold text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {label}
            </p>
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-medium text-foreground">{entry.dataKey}</span>
                        </div>
                        <span className="font-semibold text-primary">
                            ${entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
                <div className="pt-2 mt-2 border-t border-border flex justify-between">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="font-bold text-primary">${total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export const ValueByModelChart: React.FC<ChartProps> = ({ filters }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    const [hiddenModels, setHiddenModels] = React.useState<Set<string>>(new Set());

    const { data, models } = React.useMemo(() => {
        // Group by model and calculate total value
        const modelValues = filteredPumps.reduce((acc, pump) => {
            if (!acc[pump.model]) {
                acc[pump.model] = 0;
            }
            acc[pump.model] += pump.value || 0;
            return acc;
        }, {} as Record<string, number>);

        // Get top 5 models by value
        const topModels = Object.entries(modelValues)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([model]) => model);

        // Create data points (simplified - showing total values)
        // In a real scenario, you'd aggregate by time periods
        const dataPoint: Record<string, any> = { name: 'Total Value' };
        topModels.forEach(model => {
            dataPoint[model] = modelValues[model] || 0;
        });

        return {
            data: [dataPoint],
            models: topModels,
        };
    }, [filteredPumps]);

    const handleLegendClick = (dataKey: string) => {
        setHiddenModels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dataKey)) {
                newSet.delete(dataKey);
            } else {
                newSet.add(dataKey);
            }
            return newSet;
        });
    };

    if (models.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No value data available
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
                    >
                        <defs>
                            {models.map((model, index) => (
                                <linearGradient key={model} id={`gradient-${model}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            fontWeight={600}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
                            onClick={(e) => handleLegendClick(e.dataKey as string)}
                            formatter={(value: string) => (
                                <span className={`cursor-pointer transition-opacity ${hiddenModels.has(value) ? 'opacity-40' : 'opacity-100'}`}>
                                    {value}
                                </span>
                            )}
                        />
                        {models.map((model, index) => (
                            <Area
                                key={model}
                                type="monotone"
                                dataKey={model}
                                stackId="1"
                                stroke={COLORS[index % COLORS.length]}
                                fill={`url(#gradient-${model})`}
                                fillOpacity={1}
                                strokeWidth={2}
                                hide={hiddenModels.has(model)}
                                animationBegin={index * 100}
                                animationDuration={1000}
                                animationEasing="ease-in-out"
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2 font-medium">
                Click legend items to toggle models • Showing top 5 models by value
            </div>
        </div>
    );
};
