import React from 'react';
import { PumpTable } from './PumpTable';
import { useApp } from '../../store';
import { applyDashboardFilters } from './utils';
import { ChartProps } from './dashboardConfig';

export const PumpTableChart: React.FC<ChartProps> = ({ filters, onSelectPump }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);
    // Pass the onSelectPump handler down to the table
    return <div className="h-full overflow-hidden"><PumpTable pumps={filteredPumps} onSelectPump={onSelectPump} /></div>;
};
