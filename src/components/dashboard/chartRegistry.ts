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
    defaultSize: 'mini',
    height: 320,
    drillDownSequence: ['pumpsByCustomer', 'pumpTable'],
  },
  lateOrders: {
    id: 'lateOrders',
    title: 'Late Orders Trend',
    description: 'Historical late orders',
    component: LateOrdersChartWrapper,
    defaultSize: 'third',
    height: 320,
  },
  capacityByDept: {
    id: 'capacityByDept',
    title: 'Department Capacity',
    description: 'Workload vs. Capacity per Department',
    component: WorkloadByDeptProportional,
    defaultSize: 'quarter',
    height: 320,
  },
  onTimeRisk: {
    id: 'onTimeRisk',
    title: 'On-Time Risk',
    description: 'Orders at risk of being late',
    component: OnTimeRiskChart,
    defaultSize: 'quarter',
    height: 320,
  },
  leadTimeTrend: {
    id: 'leadTimeTrend',
    title: 'Lead Time Trend',
    component: LeadTimeTrendChart,
    defaultSize: 'half',
    height: 320,
  },

  // ---- ANALYSIS CHARTS ----
  totalPoValue: {
    id: 'totalPoValue',
    title: 'Total Order Value',
    description: 'Cumulative value of active orders',
    component: TotalValueTrendChart,
    defaultSize: 'half',
    height: 320,
  },
  throughputTrend: {
    id: 'throughputTrend',
    title: 'Throughput',
    description: 'Completed pumps over time',
    component: ThroughputTrendChart,
    defaultSize: 'half',
    height: 320,
  },
  cycleTimeBreakdown: {
    id: 'cycleTimeBreakdown',
    title: 'Cycle Time Breakdown',
    description: 'Average days spent in each stage',
    component: CycleTimeBreakdownChart,
    defaultSize: 'quarter',
    height: 320,
  },
  treemap: {
    id: 'treemap',
    title: 'WIP Treemap',
    description: 'Pumps sized by value, colored by stage',
    component: TreemapChart,
    defaultSize: 'large',
    height: 320,
  },
  pumpTable: {
    id: 'pumpTable',
    title: 'Pump Details',
    component: PumpTableChart,
    defaultSize: 'full',
    height: 320,
    containerClass: 'min-h-[320px]',
  },
  lateOrdersList: {
    id: 'lateOrdersList',
    title: 'Late Order Details',
    component: LateOrdersList,
    defaultSize: 'quarter',
    height: 320,
  },

  // ---- DRILLDOWN PANELS ----
  pumpsByCustomer: {
    id: 'pumpsByCustomer',
    title: 'Pumps by Customer',
    component: DrilldownChartsPanelWrapper,
    defaultSize: 'full',
    height: 320,
  },
  // Re-using same component for simplicity or distinct ones if they existed:
  pumpsByModel: {
    id: 'pumpsByModel',
    title: 'Pumps by Model',
    component: DrilldownChartsPanelWrapper,
    defaultSize: 'full',
    height: 320,
  },
}
