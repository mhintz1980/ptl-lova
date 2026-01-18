import { ChartConfig } from './dashboardConfig'
import { LeadTimeTrendChart } from './TrendChart'
import { TreemapChart } from './charts/TreemapChart'
import { PumpTableChart } from './PumpTableChart'
import { LateOrdersChartWrapper } from './LateOrdersChart'

// New Charts
import { WipCyclingDonut } from './charts/WipCyclingDonut'
import { WorkloadByDeptProportional } from './charts/WorkloadByDeptProportional'
import { ThroughputTrendChart } from './charts/ThroughputTrendChart'
import { TotalValueTrendChart } from './charts/TotalValueTrendChart'
import { CycleTimeBreakdownChart } from './charts/CycleTimeBreakdownChart'
import { LateOrdersList } from './LateOrdersList'
import { DrilldownChartsPanelWrapper } from './charts/DrilldownChartsPanel'
import { OnTimeRiskChart } from './charts/OnTimeRiskChart'

export const CHART_REGISTRY: Record<string, ChartConfig> = {
  // ---- CORE / OVERVIEW CHARTS ----
  wipByStage: {
    id: 'wipByStage',
    title: 'WIP Overview',
    description: 'Cycling view of Work In Progress',
    component: WipCyclingDonut,
    defaultSize: 'third',
    height: 450,
    drillDownSequence: ['pumpsByCustomer', 'pumpTable'],
  },
  lateOrders: {
    id: 'lateOrders',
    title: 'Late Orders Trend',
    description: 'Historical late orders',
    component: LateOrdersChartWrapper,
    defaultSize: 'third',
    height: 450,
  },
  capacityByDept: {
    id: 'capacityByDept',
    title: 'Department Capacity',
    description: 'Workload vs. Capacity per Department',
    component: WorkloadByDeptProportional,
    defaultSize: 'third',
    height: 450,
  },
  onTimeRisk: {
    id: 'onTimeRisk',
    title: 'On-Time Risk',
    description: 'Orders at risk of being late',
    component: OnTimeRiskChart,
    defaultSize: 'third',
    height: 450,
  },
  leadTimeTrend: {
    id: 'leadTimeTrend',
    title: 'Lead Time Trend',
    component: LeadTimeTrendChart,
    defaultSize: 'half',
    height: 450,
  },

  // ---- ANALYSIS CHARTS ----
  totalPoValue: {
    id: 'totalPoValue',
    title: 'Total Order Value',
    description: 'Cumulative value of active orders',
    component: TotalValueTrendChart,
    defaultSize: 'half',
    height: 450,
  },
  throughputTrend: {
    id: 'throughputTrend',
    title: 'Throughput',
    description: 'Completed pumps over time',
    component: ThroughputTrendChart,
    defaultSize: 'half',
    height: 450,
  },
  cycleTimeBreakdown: {
    id: 'cycleTimeBreakdown',
    title: 'Cycle Time Breakdown',
    description: 'Average days spent in each stage',
    component: CycleTimeBreakdownChart,
    defaultSize: 'third',
    height: 450,
  },
  treemap: {
    id: 'treemap',
    title: 'WIP Treemap',
    description: 'Pumps sized by value, colored by stage',
    component: TreemapChart,
    defaultSize: 'large',
    height: 450,
  },
  pumpTable: {
    id: 'pumpTable',
    title: 'Pump Details',
    component: PumpTableChart,
    defaultSize: 'full',
    height: 450,
    containerClass: 'min-h-[450px]',
  },
  lateOrdersList: {
    id: 'lateOrdersList',
    title: 'Late Order Details',
    component: LateOrdersList,
    defaultSize: 'third',
    height: 450,
  },

  // ---- DRILLDOWN PANELS ----
  pumpsByCustomer: {
    id: 'pumpsByCustomer',
    title: 'Pumps by Customer',
    component: DrilldownChartsPanelWrapper,
    defaultSize: 'full',
    height: 450,
  },
  // Re-using same component for simplicity or distinct ones if they existed:
  pumpsByModel: {
    id: 'pumpsByModel',
    title: 'Pumps by Model',
    component: DrilldownChartsPanelWrapper,
    defaultSize: 'full',
    height: 450,
  },
}
