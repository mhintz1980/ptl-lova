import { useState, useMemo } from 'react'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { Pump } from '../../../types'
import { DashboardFilters, ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { applyDashboardFilters } from '../utils'

interface WorkloadDonutChartProps {
  pumps: Pump[]
  onDrilldown?: (update: Partial<DashboardFilters>) => void
}

const CUSTOMER_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
]

export function WorkloadDonutChart({
  pumps,
  onDrilldown,
}: WorkloadDonutChartProps) {
  const [drilldownPath, setDrilldownPath] = useState<string[]>([])

  // Filter out closed pumps for workload
  const activePumps = useMemo(
    () => pumps.filter((p) => p.stage !== 'CLOSED'),
    [pumps]
  )

  // Group data by customer
  const customerData = useMemo(() => {
    const customerMap = new Map<string, { pumps: Pump[]; total: number }>()

    activePumps.forEach((pump) => {
      if (!customerMap.has(pump.customer)) {
        customerMap.set(pump.customer, { pumps: [], total: 0 })
      }
      const data = customerMap.get(pump.customer)!
      data.pumps.push(pump)
      data.total += 1
    })

    return Array.from(customerMap.entries())
      .map(([customer, data], index) => ({
        customer,
        pumps: data.pumps,
        total: data.total,
        color: CUSTOMER_COLORS[index % CUSTOMER_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total)
  }, [activePumps])

  // Get current view data based on drilldown path
  const currentData = useMemo((): DonutSegment[] => {
    if (drilldownPath.length === 0) {
      // Top level - show customers
      return customerData.map((data) => ({
        id: data.customer,
        label: data.customer,
        value: data.total,
        color: data.color,
        sublabel: `${data.pumps.length} pump${
          data.pumps.length === 1 ? '' : 's'
        }`,
      }))
    } else if (drilldownPath.length === 1) {
      // Second level - show POs for selected customer
      const selectedCustomer = drilldownPath[0]
      const customerInfo = customerData.find(
        (c) => c.customer === selectedCustomer
      )

      if (!customerInfo) return []

      // Group by PO
      const poMap = new Map<string, Pump[]>()
      customerInfo.pumps.forEach((pump) => {
        if (!poMap.has(pump.po)) {
          poMap.set(pump.po, [])
        }
        poMap.get(pump.po)!.push(pump)
      })

      return Array.from(poMap.entries())
        .map(([po, poPumps]) => ({
          id: po,
          label: po,
          value: poPumps.length,
          color: customerInfo.color,
          sublabel: `${poPumps
            .map((p) => p.model)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ')}`,
        }))
        .sort((a, b) => b.value - a.value)
    } else if (drilldownPath.length === 2) {
      // Third level - show stage breakdown for selected PO
      const selectedCustomer = drilldownPath[0]
      const selectedPO = drilldownPath[1]
      const customerInfo = customerData.find(
        (c) => c.customer === selectedCustomer
      )
      const poPumps = customerInfo?.pumps.filter((p) => p.po === selectedPO)

      if (!poPumps) return []

      // Count by completion status (using stage - before SHIP = in progress, SHIP/CLOSED = complete)
      const closedCount = pumps.filter(
        (p) =>
          p.customer === selectedCustomer &&
          p.po === selectedPO &&
          p.stage === 'CLOSED'
      ).length
      const totalForPO = poPumps.length + closedCount

      return [
        {
          id: 'completed',
          label: 'Completed',
          value: closedCount,
          color: '#10b981',
          sublabel: `${
            totalForPO > 0 ? ((closedCount / totalForPO) * 100).toFixed(0) : 0
          }% complete`,
        },
        {
          id: 'remaining',
          label: 'In Progress',
          value: poPumps.length,
          color: '#3b82f6',
          sublabel: `${
            totalForPO > 0
              ? ((poPumps.length / totalForPO) * 100).toFixed(0)
              : 0
          }% remaining`,
        },
      ].filter((s) => s.value > 0)
    }

    return []
  }, [drilldownPath, customerData, pumps])

  const handleSegmentClick = (segment: DonutSegment) => {
    if (drilldownPath.length < 2) {
      setDrilldownPath([...drilldownPath, segment.id])
      // Trigger dashboard filter update on first drill
      if (drilldownPath.length === 0 && onDrilldown) {
        onDrilldown({ customerId: segment.id })
      }
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([])
      // Clear customer filter
      if (onDrilldown) {
        onDrilldown({ customerId: undefined })
      }
    } else {
      setDrilldownPath(drilldownPath.slice(0, index))
    }
  }

  const getTitle = () => {
    if (drilldownPath.length === 0) return 'Workload by Customer'
    if (drilldownPath.length === 1) return `Orders for ${drilldownPath[0]}`
    if (drilldownPath.length === 2) return `${drilldownPath[1]} Progress`
    return 'Workload Analysis'
  }

  if (activePumps.length === 0) {
    return (
      <div className="layer-l1 rounded-lg border p-6 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No active orders</p>
      </div>
    )
  }

  return (
    <DrilldownDonutChart
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
export const WorkloadDonutChartWrapper: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )
  return <WorkloadDonutChart pumps={filteredPumps} onDrilldown={onDrilldown} />
}
