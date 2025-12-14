
import { ChartConfig, ChartId } from './dashboardConfig';
import { WorkloadByCustomerChart, WorkloadByModelChart } from './WorkloadChart';
import { ValueByCustomerChart } from './ValueChart';
import { LeadTimeTrendChart } from './TrendChart';
import { CapacityByDeptChart } from './CapacityChart';
import { TreemapChart } from './charts/TreemapChart';
import { PumpTableChart } from './PumpTableChart';
import { LateOrdersChartWrapper } from './LateOrdersChart';
import { TotalValueChartWrapper } from './TotalValueChart';
import { PlaceholderChart } from './PlaceholderChart';
import { ModelBarChart } from './charts/ModelBarChart';
import { PumpCardGrid } from './charts/PumpCardGrid';
import { RadialBarChart } from './charts/RadialBarChart';
import { ValueByModelChart } from './charts/ValueByModelChart';



export const CHART_REGISTRY: Record<ChartId, ChartConfig> = {
    wipByStage: {
        id: 'wipByStage',
        title: 'WIP by Stage',
        description: 'Current pumps in each stage',
        component: CapacityByDeptChart,
        defaultSize: 'md',
        drillDownSequence: ['pumpsByCustomer'],
    },
    capacityByDept: {
        id: 'capacityByDept',
        title: 'Capacity by Department',
        description: 'Workload distribution across departments',
        component: CapacityByDeptChart,
        defaultSize: 'lg',
        drillDownSequence: ['pumpsByModel', 'radialBarChart'],
    },
    lateOrders: {
        id: 'lateOrders',
        title: 'Late Orders',
        description: 'Orders past their promise date',
        component: LateOrdersChartWrapper,
        defaultSize: 'md',
        drillDownSequence: ['pumpCardGrid'],
    },
    leadTimeTrend: {
        id: 'leadTimeTrend',
        title: 'Lead Time Trend',
        description: 'Average build time over last 12 weeks',
        component: LeadTimeTrendChart,
        defaultSize: 'lg',
        drillDownSequence: ['pumpCardGrid'],
    },
    pumpsByCustomer: {
        id: 'pumpsByCustomer',
        title: 'Pumps by Customer',
        description: 'Top customers by volume',
        component: WorkloadByCustomerChart,
        defaultSize: 'md',
        drillDownSequence: ['modelBarChart', 'pumpCardGrid'],
    },
    pumpsByModel: {
        id: 'pumpsByModel',
        title: 'WIP by Model',
        description: 'Most popular pump models',
        component: WorkloadByModelChart,
        defaultSize: 'md',
        drillDownSequence: ['pumpsByCustomer'],
    },
    modelBarChart: {
        id: 'modelBarChart',
        title: 'Models Breakdown',
        description: 'Horizontal bar chart of pump models',
        component: ModelBarChart,
        defaultSize: 'lg',
        drillDownSequence: ['pumpCardGrid'],
    },
    radialBarChart: {
        id: 'radialBarChart',
        title: 'Model Distribution',
        description: 'Circular visualization of pump models',
        component: RadialBarChart,
        defaultSize: 'lg',
        drillDownSequence: ['valueByModel'],
    },
    valueByModel: {
        id: 'valueByModel',
        title: 'Value by Model',
        description: 'Total value distribution across models',
        component: ValueByModelChart,
        defaultSize: 'lg',
    },
    pumpCardGrid: {
        id: 'pumpCardGrid',
        title: 'Pump Overview',
        description: 'Visual card layout of filtered pumps',
        component: PumpCardGrid,
        defaultSize: 'lg',
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
        drillDownSequence: ['valueByModel', 'pumpCardGrid'],
    },
    treemap: {
        id: 'treemap',
        title: 'Production Treemap',
        description: 'Interactive view of all active orders (Click to drill down)',
        component: TreemapChart,
        defaultSize: 'lg',
        drillDownSequence: ['modelBarChart', 'pumpCardGrid'],
    },
    pumpTable: {
        id: 'pumpTable',
        title: 'Detailed Pump List',
        description: 'Filtered list of pumps',
        component: PumpTableChart,
        defaultSize: 'lg',
    },
    totalPoValue: {
        id: 'totalPoValue',
        title: 'Total PO Value',
        description: 'Aggregate value of all active orders',
        component: TotalValueChartWrapper,
        defaultSize: 'sm',
        drillDownSequence: ['valueByCustomer', 'pumpTable'],
    },
};
