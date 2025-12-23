import { useState, useMemo } from 'react'
import { DrilldownTreemapChart, TreemapSegment } from './DrilldownTreemapChart'
import { Pump } from '../../../types'
import { DashboardFilters, ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { applyDashboardFilters } from '../utils'
import { parseISO, differenceInDays } from 'date-fns'

interface ModelTreemapChartProps {
  pumps: Pump[]
  onDrilldown?: (update: Partial<DashboardFilters>) => void
}

const MODEL_COLORS: Record<string, string> = {
  // Default colors for common models
  'EHC-0400': '#3b82f6',
  'EHC-0600': '#8b5cf6',
  'EHC-0800': '#ec4899',
  'EHC-1000': '#f59e0b',
  'EHC-1200': '#10b981',
  'EHC-1500': '#06b6d4',
}

const FALLBACK_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#6366f1',
]

const STATUS_COLORS: Record<string, string> = {
  'on-time': '#10b981',
  'at-risk': '#f59e0b',
  late: '#ef4444',
}

// Derive status from promise date
const getStatus = (pump: Pump): 'on-time' | 'at-risk' | 'late' => {
  if (!pump.promiseDate || pump.stage === 'CLOSED') return 'on-time'
  try {
    const promise = parseISO(pump.promiseDate)
    const daysUntilDue = differenceInDays(promise, new Date())
    if (daysUntilDue < 0) return 'late'
    if (daysUntilDue <= 7) return 'at-risk'
    return 'on-time'
  } catch {
    return 'on-time'
  }
}

export function ModelTreemapChart({
  pumps,
  onDrilldown,
}: ModelTreemapChartProps) {
  const [drilldownPath, setDrilldownPath] = useState<string[]>([])

  // Filter out closed pumps
  const activePumps = useMemo(
    () => pumps.filter((p) => p.stage !== 'CLOSED'),
    [pumps]
  )

  // Group data by model
  const modelData = useMemo(() => {
    const modelMap = new Map<
      string,
      { pumps: Pump[]; total: number; customers: Set<string> }
    >()

    activePumps.forEach((pump) => {
      if (!modelMap.has(pump.model)) {
        modelMap.set(pump.model, {
          pumps: [],
          total: 0,
          customers: new Set(),
        })
      }
      const data = modelMap.get(pump.model)!
      data.pumps.push(pump)
      data.total += 1
      data.customers.add(pump.customer)
    })

    return Array.from(modelMap.entries())
      .map(([model, data], index) => ({
        model,
        pumps: data.pumps,
        total: data.total,
        customerCount: data.customers.size,
        color:
          MODEL_COLORS[model] ||
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total)
  }, [activePumps])

  // Get current view data based on drilldown path
  const currentData = useMemo((): TreemapSegment[] => {
    if (drilldownPath.length === 0) {
      // Top level - show models
      return modelData.map((data) => ({
        id: data.model,
        label: data.model,
        value: data.total,
        color: data.color,
        sublabel: `${data.customerCount} customer${
          data.customerCount === 1 ? '' : 's'
        }`,
      }))
    } else if (drilldownPath.length === 1) {
      // Second level - show customers for selected model
      const selectedModel = drilldownPath[0]
      const modelInfo = modelData.find((m) => m.model === selectedModel)

      if (!modelInfo) return []

      const customerMap = new Map<string, { pumps: Pump[]; total: number }>()
      modelInfo.pumps.forEach((pump) => {
        if (!customerMap.has(pump.customer)) {
          customerMap.set(pump.customer, { pumps: [], total: 0 })
        }
        const data = customerMap.get(pump.customer)!
        data.pumps.push(pump)
        data.total += 1
      })

      return Array.from(customerMap.entries())
        .map(([customer, data]) => ({
          id: customer,
          label: customer,
          value: data.total,
          color: modelInfo.color,
          sublabel: `${data.pumps.length} pump${
            data.pumps.length === 1 ? '' : 's'
          }`,
        }))
        .sort((a, b) => b.value - a.value)
    } else if (drilldownPath.length === 2) {
      // Third level - show status breakdown for selected customer and model
      const selectedModel = drilldownPath[0]
      const selectedCustomer = drilldownPath[1]
      const modelInfo = modelData.find((m) => m.model === selectedModel)
      const customerPumps = modelInfo?.pumps.filter(
        (p) => p.customer === selectedCustomer
      )

      if (!customerPumps) return []

      // Group by status
      const statusMap = new Map<string, number>()
      customerPumps.forEach((pump) => {
        const status = getStatus(pump)
        statusMap.set(status, (statusMap.get(status) || 0) + 1)
      })

      return Array.from(statusMap.entries())
        .map(([status, value]) => ({
          id: status,
          label:
            status === 'on-time'
              ? 'On Time'
              : status === 'at-risk'
              ? 'At Risk'
              : 'Late',
          value,
          color: STATUS_COLORS[status] || '#64748b',
          sublabel: `${value} pump${value === 1 ? '' : 's'}`,
        }))
        .sort((a, b) => b.value - a.value)
    }

    return []
  }, [drilldownPath, modelData])

  const handleSegmentClick = (segment: TreemapSegment) => {
    if (drilldownPath.length < 2) {
      setDrilldownPath([...drilldownPath, segment.id])
      // Trigger dashboard filter update
      if (drilldownPath.length === 0 && onDrilldown) {
        onDrilldown({ modelId: segment.id })
      }
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([])
      if (onDrilldown) {
        onDrilldown({ modelId: undefined })
      }
    } else {
      setDrilldownPath(drilldownPath.slice(0, index))
    }
  }

  const getTitle = () => {
    if (drilldownPath.length === 0) return 'Model Distribution'
    if (drilldownPath.length === 1) return `${drilldownPath[0]} by Customer`
    if (drilldownPath.length === 2)
      return `${drilldownPath[0]} Status for ${drilldownPath[1]}`
    return 'Model Analysis'
  }

  if (activePumps.length === 0) {
    return (
      <div className="layer-l1 rounded-lg border p-6 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No active orders</p>
      </div>
    )
  }

  return (
    <DrilldownTreemapChart
      data={currentData}
      title={getTitle()}
      onSegmentClick={drilldownPath.length < 2 ? handleSegmentClick : undefined}
      breadcrumbs={drilldownPath}
      onBreadcrumbClick={handleBreadcrumbClick}
      valueFormatter={(v) => `${v} pump${v === 1 ? '' : 's'}`}
    />
  )
}

// Wrapper for chart registry integration
export const ModelTreemapChartWrapper: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )
  return <ModelTreemapChart pumps={filteredPumps} onDrilldown={onDrilldown} />
}
