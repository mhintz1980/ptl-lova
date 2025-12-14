import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { ChartProps } from '../dashboardConfig';
import { useApp } from '../../../store';
import { applyDashboardFilters } from '../utils';

import { ChevronRight, Home } from 'lucide-react';

interface TreemapNode {
    name: string;
    value: number;
    type: 'customer' | 'po' | 'model' | 'root';
    originalName: string; // To store exact ID/Name for filtering
    children?: TreemapNode[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: TreemapNode; value: number }[] }) => {
    if (active && payload && payload.length) {
        const node = payload[0].payload;
        return (
            <div className="bg-background/95 backdrop-blur-sm border-2 border-border rounded-lg shadow-xl p-3">
                <p className="font-bold text-foreground text-base">{node.name}</p>
                <p className="text-sm font-semibold text-primary">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(payload[0].value)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {node.type === 'customer' ? 'Click to view POs' :
                        node.type === 'po' ? 'Click to view Models' : 'Model Value'}
                </p>
            </div>
        );
    }
    return null;
};

interface AnimatedTreemapContentProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    name?: string;
    value?: number;
    payload?: TreemapNode;
    depth?: number;
    onClick?: (node: TreemapNode) => void;
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
];

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(val);

const AnimatedTreemapContent = (props: AnimatedTreemapContentProps) => {
    const { x, y, width, height, index, name, value, payload, depth, onClick } = props;

    if (depth === 1) return null;

    if (
        x === undefined ||
        y === undefined ||
        width === undefined ||
        height === undefined ||
        index === undefined ||
        !payload ||
        !onClick
    ) {
        return null;
    }

    return (
        <g>
            <motion.rect
                x={x}
                y={y}
                width={width}
                height={height}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{
                    scale: 1.03,
                    filter: "brightness(1.2) drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))",
                    zIndex: 10
                }}
                transition={{ duration: 0.3 }}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                    cursor: 'pointer',
                }}
                onClick={() => onClick(payload)}
            />
            {width > 40 && height > 20 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={Math.min(14, width / 8)}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                    {name}
                </text>
            )}
            {width > 40 && height > 40 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 14}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize={Math.min(11, width / 10)}
                    fontWeight={600}
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                    {value ? formatCurrency(value) : ''}
                </text>
            )}
        </g>
    );
};

export const TreemapChart: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    const [view, setView] = useState<'root' | 'customer' | 'po'>('root');
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedPo, setSelectedPo] = useState<string | null>(null);

    const data = useMemo(() => {
        let currentPumps = filteredPumps;
        let groupBy: 'customer' | 'po' | 'model' = 'customer';

        if (view === 'customer' && selectedCustomer) {
            currentPumps = currentPumps.filter(p => p.customer === selectedCustomer);
            groupBy = 'po';
        } else if (view === 'po' && selectedPo) {
            currentPumps = currentPumps.filter(p => p.po === selectedPo);
            groupBy = 'model';
        }

        const groups: Record<string, number> = {};
        currentPumps.forEach(pump => {
            const key = groupBy === 'customer' ? pump.customer :
                groupBy === 'po' ? pump.po : pump.model;
            groups[key] = (groups[key] || 0) + pump.value;
        });

        const items = Object.entries(groups)
            .map(([name, value]) => ({
                name,
                value,
                type: groupBy,
                originalName: name
            }))
            .sort((a, b) => b.value - a.value);

        return [{
            name: 'Root',
            value: 0,
            type: 'root' as const,
            originalName: 'root',
            children: items
        }];
    }, [filteredPumps, view, selectedCustomer, selectedPo]);

    const handleNodeClick = (node: TreemapNode) => {
        if (node.type === 'customer') {
            setSelectedCustomer(node.originalName);
            setView('customer');
        } else if (node.type === 'po') {
            setSelectedPo(node.originalName);
            setView('po');
        } else {
            // Leaf node (Model) - maybe drill down to global filter?
            onDrilldown({ modelId: node.originalName });
        }
    };

    const handleReset = () => {
        setView('root');
        setSelectedCustomer(null);
        setSelectedPo(null);
    };

    const handleBack = () => {
        if (view === 'po') {
            setView('customer');
            setSelectedPo(null);
        } else if (view === 'customer') {
            handleReset();
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
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <button onClick={handleReset} className="hover:text-foreground flex items-center gap-1">
                    <Home className="h-3 w-3" /> All
                </button>
                {view !== 'root' && (
                    <>
                        <ChevronRight className="h-3 w-3" />
                        <button onClick={() => view === 'po' ? handleBack() : null} className={view === 'po' ? "hover:text-foreground" : "font-semibold text-foreground"}>
                            {selectedCustomer}
                        </button>
                    </>
                )}
                {view === 'po' && (
                    <>
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-semibold text-foreground">{selectedPo}</span>
                    </>
                )}
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={data}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="hsl(var(--background))"
                        fill="#8884d8"
                        content={<AnimatedTreemapContent onClick={handleNodeClick} />}
                        animationDuration={500}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-muted-foreground mt-1">
                {view === 'root' ? 'By Customer Value' : view === 'customer' ? 'By PO Value' : 'By Model Value'}
            </div>
        </div>
    );
};
