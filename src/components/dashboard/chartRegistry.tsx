
import { ChartConfig, ChartId } from './dashboardConfig';
import { WorkloadByCustomerChart, WorkloadByModelChart } from './WorkloadChart';
import { ValueByCustomerChart } from './ValueChart';
import { LeadTimeTrendChart } from './TrendChart';
import { CapacityByDeptChart } from './CapacityChart';
import { TreemapChart } from './charts/TreemapChart';

// Placeholder for now
const PlaceholderChart = () => <div className="p-4 text-muted-foreground" > Chart not implemented </div>;

export const CHART_REGISTRY: Record<ChartId, ChartConfig> = {
    wipByStage: {
        id: 'wipByStage',
        title: 'WIP by Stage',
        description: 'Current pumps in each stage',
        component: CapacityByDeptChart, // Reusing capacity for now as it shows stage counts
        defaultSize: 'md',
    },
    capacityByDept: {
        id: 'capacityByDept',
        title: 'Capacity by Department',
        description: 'Workload distribution across departments',
        component: CapacityByDeptChart,
        defaultSize: 'lg',
    },
    lateOrders: {
        id: 'lateOrders',
        title: 'Late Orders',
        description: 'Orders past their promise date',
        component: PlaceholderChart, // To be implemented
        defaultSize: 'md',
    },
    leadTimeTrend: {
        id: 'leadTimeTrend',
        title: 'Lead Time Trend',
        description: 'Average build time over last 12 weeks',
        component: LeadTimeTrendChart,
        defaultSize: 'lg',
    },
    pumpsByCustomer: {
        id: 'pumpsByCustomer',
        title: 'Pumps by Customer',
        description: 'Top customers by volume',
        component: WorkloadByCustomerChart,
        defaultSize: 'md',
    },
    pumpsByModel: {
        id: 'pumpsByModel',
        title: 'Pumps by Model',
        description: 'Most popular pump models',
        component: WorkloadByModelChart,
        defaultSize: 'md',
    },
    reworkRate: {
        id: 'reworkRate',
        title: 'Rework Rate',
        description: 'Percentage of pumps requiring rework',
        component: PlaceholderChart,
        defaultSize: 'sm',
    },
    valueByCustomer: {
        id: 'valueByCustomer',
        title: 'Value by Customer',
        description: 'Total order value by customer',
        component: ValueByCustomerChart,
        defaultSize: 'md',
    },
    treemap: {
        id: 'treemap',
        title: 'Production Treemap',
        description: 'Interactive view of all active orders (Click to drill down)',
        component: TreemapChart,
        defaultSize: 'lg',
    },
};
