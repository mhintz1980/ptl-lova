import { ChartConfig } from './dashboardConfig'
import { WorkloadByCustomerChart, WorkloadByModelChart } from './WorkloadChart'
import { ValueByCustomerChart } from './ValueChart'
import { LeadTimeTrendChart } from './TrendChart'
import { TreemapChart } from './charts/TreemapChart'
import { PumpTableChart } from './PumpTableChart'
import { LateOrdersChartWrapper } from './LateOrdersChart'
import { PlaceholderChart } from './PlaceholderChart'

// New Charts
import { WipCyclingDonut } from './charts/WipCyclingDonut'
import { WorkloadByDeptProportional } from './charts/WorkloadByDeptProportional'
import { ThroughputTrendChart } from './charts/ThroughputTrendChart'
import { TotalValueTrendChart } from './charts/TotalValueTrendChart'
import { StagePipelineChart } from './charts/StagePipelineChart'
import { CycleTimeBreakdownChart } from './charts/CycleTimeBreakdownChart'
import { LateOrdersList } from './LateOrdersList'

export const CHART_REGISTRY: Record<string, ChartConfig> = {
  wipByStage: {
    id: 'wipByStage',
    title: 'WIP Overview',
    description: 'Cycling view of Work In Progress',
    component: WipCyclingDonut,
    defaultSize: 'md',
    drillDownSequence: ['pumpsByCustomer', 'pumpTable'],
  },
  wipDonut: {
    id: 'wipDonut',
    title: 'Active WIP',
    description: 'Multi-perspective view of active orders',
    component: WipCyclingDonut,
    defaultSize: 'md',
  },
  capacityByDept: {
    id: 'capacityByDept',
    title: 'Workload Distribution',
    description: 'Current load by department',
    component: WorkloadByDeptProportional,
    defaultSize: 'lg',
  },
  lateOrders: {
    id: 'lateOrders',
    title: 'Late Orders',
    description: 'Orders past their promise date',
    component: LateOrdersChartWrapper,
    defaultSize: 'md',
    drillDownSequence: ['pumpTable'],
  },
  lateOrdersList: {
    id: 'lateOrdersList',
    title: 'Late Orders Alert',
    description: 'List of overdue orders needing attention',
    component: LateOrdersList,
    defaultSize: 'md',
  },
  leadTimeTrend: {
    id: 'leadTimeTrend',
    title: 'Lead Time Trend',
    description: 'Average build time over last 12 weeks',
    component: LeadTimeTrendChart,
    defaultSize: 'lg',
    drillDownSequence: ['pumpTable'],
  },
  pumpsByCustomer: {
    id: 'pumpsByCustomer',
    title: 'Pumps by Customer',
    description: 'Top customers by volume',
    component: WorkloadByCustomerChart,
    defaultSize: 'md',
    drillDownSequence: ['pumpsByModel', 'pumpTable'],
  },
  pumpsByModel: {
    id: 'pumpsByModel',
    title: 'Pumps by Model',
    description: 'Most popular pump models',
    component: WorkloadByModelChart,
    defaultSize: 'md',
    drillDownSequence: ['pumpTable'],
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
    drillDownSequence: ['pumpTable'],
  },
  treemap: {
    id: 'treemap',
    title: 'Value Treemap',
    description: 'Interactive value distribution',
    component: TreemapChart,
    defaultSize: 'lg',
    drillDownSequence: ['pumpTable'],
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
    title: 'Total Value Trend',
    description: 'Value of active orders over time',
    component: TotalValueTrendChart,
    defaultSize: 'sm',
    drillDownSequence: ['valueByCustomer', 'pumpTable'],
  },
  throughputTrend: {
    id: 'throughputTrend',
    title: 'Weekly Throughput',
    description: 'Pumps completed per week',
    component: ThroughputTrendChart,
    defaultSize: 'lg',
  },
  valueTrend: {
    id: 'valueTrend',
    title: 'Value Trend',
    description: 'Active value over time',
    component: TotalValueTrendChart,
    defaultSize: 'md',
  },
  stageGenericPipeline: {
    id: 'stageGenericPipeline',
    title: 'Production Pipeline',
    description: 'Live 3D visualization of active pump flow',
    component: StagePipelineChart,
    defaultSize: 'lg',
    drillDownSequence: ['pumpTable'],
  },
  cycleTimeBreakdown: {
    id: 'cycleTimeBreakdown',
    title: 'Avg Time in Stage',
    description: 'Average age of active inventory by stage',
    component: CycleTimeBreakdownChart,
    defaultSize: 'md',
  },
}
