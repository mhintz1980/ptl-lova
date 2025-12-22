import type { ComponentType } from 'react'
import { Stage } from '../../types'

// ---- IDs ----
export type DashboardTopicId =
  | 'production'
  | 'schedule'
  | 'sales'
  | 'bottlenecks'
  | 'quality'

// Dashboard Modes (new navigation paradigm)
export type DashboardMode = 'operations' | 'value' | 'production'

export type KpiId =
  | 'activeWip'
  | 'lateOrders'
  | 'capacityUtil'
  | 'totalValue'
  | 'avgOrderValue'
  | 'topCustomer'
  | 'avgLeadTime'
  | 'throughput'
  | 'onTimeRate'

export type ChartId =
  | 'wipByStage'
  | 'wipDonut'
  | 'capacityByDept'
  | 'lateOrders'
  | 'lateOrdersList' // New
  | 'leadTimeTrend'
  | 'pumpsByCustomer'
  | 'pumpsByModel'
  | 'reworkRate'
  | 'valueByCustomer'
  | 'valueTrend'
  | 'treemap'
  | 'pumpTable'
  | 'totalPoValue'
  | 'throughputTrend'
  | 'stageGenericPipeline'
  | 'cycleTimeBreakdown' // New

// ---- Shared filters for drilldown ----
export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null }
  customerId?: string
  modelId?: string
  department?: 'Fabrication' | 'Powder Coat' | 'Assembly' | 'Testing & Shipping'
  stage?: Stage
}

// Every chart component will receive this:
export interface ChartProps {
  filters: DashboardFilters
  onDrilldown: (update: Partial<DashboardFilters>) => void
}

export interface ChartConfig {
  id: ChartId
  title: string
  description?: string
  component: ComponentType<ChartProps>
  defaultSize?: 'sm' | 'md' | 'lg'
  drillDownSequence?: ChartId[]
}

export interface TopicConfig {
  id: DashboardTopicId
  label: string
  icon?: string // or ReactNode
  chartIds: ChartId[]
}

// We will populate this as we migrate charts
export const CHART_REGISTRY: Record<string, ChartConfig> = {}

export const TOPIC_CONFIGS: TopicConfig[] = [
  {
    id: 'production',
    label: 'Production Overview',
    chartIds: ['wipByStage', 'capacityByDept', 'lateOrders', 'treemap'],
  },
  {
    id: 'schedule',
    label: 'Schedule & Lead Times',
    chartIds: ['leadTimeTrend', 'lateOrders'],
  },
  {
    id: 'sales',
    label: 'Sales & Customers',
    chartIds: ['pumpsByCustomer', 'pumpsByModel', 'valueByCustomer'],
  },
  {
    id: 'bottlenecks',
    label: 'Bottlenecks',
    chartIds: ['capacityByDept', 'lateOrders'],
  },
]

// ---- Mode-based Dashboard Configuration ----
export interface ModeConfig {
  id: DashboardMode
  label: string
  icon: string
  kpis: KpiId[]
  chartIds: ChartId[]
}

export const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'operations',
    label: 'Operations',
    icon: 'activity',
    kpis: ['activeWip', 'lateOrders', 'capacityUtil'],
    // Use LateOrdersList instead of Chart here? Maybe keep both or swap.
    // Plan: "Operations: WIP Cycling Donut, Late Orders List, Workload Proportional Bars"
    chartIds: ['wipByStage', 'lateOrdersList', 'capacityByDept'],
  },
  {
    id: 'value',
    label: 'Value',
    icon: 'dollar-sign',
    kpis: ['totalValue', 'avgOrderValue', 'topCustomer'],
    chartIds: ['totalPoValue', 'treemap', 'valueByCustomer'],
  },
  {
    id: 'production',
    label: 'Production',
    icon: 'bar-chart-2',
    kpis: ['avgLeadTime', 'throughput', 'onTimeRate'],
    chartIds: [
      'throughputTrend',
      'stageGenericPipeline',
      'cycleTimeBreakdown',
      'lateOrders',
    ],
  },
]
