// src/components/dashboard/charts/RadialBarChart.tsx
import React from 'react';
import { RadialBarChart as RechartsRadialBar, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
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
        payload: {
            model: string;
            count: number;
            fill: string;
            percentage: string;
        };
    }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
        <div className="rounded-lg border-2 border-border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
            <p className="font-bold text-foreground text-base">{data.model}</p>
            <p className="text-sm font-semibold text-primary">
                {data.count} pumps
            </p>
            <p className="text-xs text-muted-foreground">
                {data.percentage} of total
            </p>
        </div>
    );
};

export const RadialBarChart: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    const data = React.useMemo(() => {
        const counts = filteredPumps.reduce((acc, pump) => {
            acc[pump.model] = (acc[pump.model] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const total = filteredPumps.length;
        const entries = Object.entries(counts)
            .map(([model, count]) => ({
                model,
                count,
                percentage: `${((count / total) * 100).toFixed(1)}%`,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6); // Top 6 for radial chart

        // Add fill colors and calculate angles for radial positioning
        return entries.map((item, index) => ({
            ...item,
            fill: COLORS[index % COLORS.length],
            // Normalize values for better radial display (0-100 scale)
            value: ((item.count / entries[0].count) * 100),
        }));
    }, [filteredPumps]);

    const handleClick = (data: { model?: string }) => {
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
        <div className="h-full w-full flex flex-col">
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsRadialBar
                        data={data}
                        innerRadius="10%"
                        outerRadius="90%"
                        barSize={24}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <RadialBar
                            background={{ fill: 'hsl(var(--muted))' }}
                            dataKey="value"
                            onClick={handleClick}
                            className="cursor-pointer"
                            animationBegin={0}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            iconSize={12}
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{
                                paddingLeft: '20px',
                                fontSize: '13px',
                                fontWeight: 600,
                            }}
                        />
                    </RechartsRadialBar>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2 font-medium">
                Click any segment to see value breakdown
            </div>
        </div>
    );
};
