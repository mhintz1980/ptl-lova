import type { ComponentType } from 'react'
import { Stage } from '../../types'

// ---- IDs ----
export type DashboardTopicId =
  | 'production'
  | 'schedule'
  | 'sales'
  | 'bottlenecks'
  | 'quality'

// Dashboard Modes (2-mode navigation)
export type DashboardMode = 'overview' | 'analysis'

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
  | 'lateOrdersList'
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
  | 'cycleTimeBreakdown'
  | 'drilldownCharts'
  | 'onTimeRisk' // NEW: Shows On Track / At Risk / Late
  // ---- Bento Grid Components ----
  | 'kpiProductivity'
  | 'kpiOnTime'
  | 'kpiRevenue'
  | 'insightEfficiency'
  | 'insightRework'
  | 'insightUtilization'
  | 'insightScrap'

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
  chartHeight?: number // Optional height passed from DashboardEngine
}

export type ChartSize =
  | 'mini'
  | 'small'
  | 'third'
  | 'large'
  | 'max'
  | 'quarter'
  | 'half'
  | 'three-quarter'
  | 'full'

export interface ChartConfig {
  id: ChartId
  title: string
  description?: string
  component: ComponentType<ChartProps>
  defaultSize?: ChartSize
  height?: number // Explicit height in pixels (overrides defaultSize height)
  containerClass?: string // NEW: Tailwind classes for the outer wrapper (e.g. "min-h-[200px]")
  aspectRatio?: number // SVG aspect ratio override (width/height)
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
    id: 'overview',
    label: 'Overview',
    icon: 'activity',
    kpis: ['activeWip', 'lateOrders', 'onTimeRate'],
    // Row 1: 4 quarter-width charts
    // Row 2: Optional additional charts
    chartIds: ['wipByStage', 'capacityByDept', 'lateOrdersList', 'onTimeRisk'],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: 'bar-chart-2',
    kpis: ['avgLeadTime', 'throughput', 'totalValue'],
    // Row 1: Value Trend (half) + Throughput Trend (half)
    // Row 2: Cycle Time Breakdown (quarter) + Treemap (three-quarter)
    chartIds: [
      'totalPoValue',
      'throughputTrend',
      'cycleTimeBreakdown',
      'treemap',
    ],
  },
]
