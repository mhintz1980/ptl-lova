import { useMemo, useState } from 'react'
import {
  DrilldownDonutChart,
  DonutSegment,
  DonutTab,
  DetailRow,
} from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getPumpsByCustomer, getWorkloadByStage } from '../kpiCalculators'
import { Pump, Stage } from '../../../types'

// Neon color palette matching the design system
const STAGE_COLORS: Record<string, string> = {
  QUEUE: '#94a3b8',
  FABRICATION: '#0ea5e9',
  POWDER_COAT: '#d946ef',
  ASSEMBLY: '#f97316',
  TESTING: '#fb7185',
  SHIPPING: '#22c55e',
}

const COLORS = [
  '#06b6d4', // Cyan
  '#d946ef', // Magenta
  '#f97316', // Orange
  '#22c55e', // Green
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#3b82f6', // Blue
]

type Perspective = 'stage' | 'customer' | 'model' | 'value'

const TABS: DonutTab[] = [
  { id: 'stage', label: 'Stage' },
  { id: 'customer', label: 'Cust.' },
  { id: 'model', label: 'Model' },
  { id: 'value', label: 'Value' },
]

// Helper to group pumps by key
function groupPumps(pumps: Pump[], keyFn: (p: Pump) => string) {
  const map = new Map<string, number>()
  pumps.forEach((p) => {
    const k = keyFn(p)
    map.set(k, (map.get(k) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function WipCyclingDonut({ filters, onDrilldown }: ChartProps) {
  const { pumps } = useApp()
  const [activePerspective, setActivePerspective] =
    useState<Perspective>('stage')
  const [selectedSegment, setSelectedSegment] = useState<DonutSegment | null>(
    null
  )

  // Filter out CLOSED pumps + apply filters
  const filteredPumps = useMemo(() => {
    return pumps.filter((p) => {
      if (p.stage === 'CLOSED') return false
      if (filters.customerId && p.customer !== filters.customerId) return false
      if (filters.modelId && p.model !== filters.modelId) return false
      if (filters.stage && p.stage !== filters.stage) return false
      return true
    })
  }, [pumps, filters])

  // Calculate data for current perspective
  const donutData = useMemo((): DonutSegment[] => {
    if (activePerspective === 'stage') {
      return getWorkloadByStage(filteredPumps).map((s, i) => ({
        id: s.name,
        label: s.name.replace(/_/g, ' '),
        value: s.value,
        color: STAGE_COLORS[s.name] || COLORS[i % COLORS.length],
      }))
    }

    if (activePerspective === 'customer') {
      return getPumpsByCustomer(filteredPumps)
        .slice(0, 8)
        .map((c, i) => ({
          id: c.name,
          label: c.name,
          value: c.value,
          color: COLORS[i % COLORS.length],
        }))
    }

    // Model perspective
    if (activePerspective === 'model') {
      return groupPumps(filteredPumps, (p) => p.model)
        .slice(0, 8)
        .map((m, i) => ({
          id: m.name,
          label: m.name,
          value: m.value,
          color: COLORS[i % COLORS.length],
        }))
    }

    // Value perspective - group by pump and show their value
    return filteredPumps
      .filter((p) => p.value > 0)
      .map((p, i) => ({
        id: p.id,
        label: `${p.po} - ${p.model}`,
        value: p.value,
        color: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filteredPumps, activePerspective])

  // Build inline detail data for selected segment
  const detailData = useMemo((): DetailRow[] => {
    if (!selectedSegment) return []

    // Get pumps matching the selection
    const matchingPumps = filteredPumps.filter((p) => {
      if (activePerspective === 'stage') {
        return p.stage === selectedSegment.id
      } else if (activePerspective === 'customer') {
        return p.customer === selectedSegment.id
      } else if (activePerspective === 'model') {
        return p.model === selectedSegment.id
      } else {
        // Value perspective - segment id is pump id
        return p.id === selectedSegment.id
      }
    })

    // Return pump details (PO, model/stage, customer)
    return matchingPumps.slice(0, 10).map((p) => ({
      id: p.id,
      label: p.po,
      value:
        activePerspective === 'stage'
          ? p.model
          : activePerspective === 'value'
            ? `$${p.value.toLocaleString()}`
            : p.stage.replace(/_/g, ' '),
      sublabel: activePerspective === 'customer' ? p.model : p.customer,
    }))
  }, [selectedSegment, filteredPumps, activePerspective])

  // Handle segment selection
  const handleSegmentSelect = (segment: DonutSegment | null) => {
    setSelectedSegment(segment)
  }

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActivePerspective(tabId as Perspective)
    setSelectedSegment(null) // Clear selection when switching tabs
  }

  // Handle drill-down when user wants to see more (optional, via onDrilldown)
  const handleSegmentClick = (segment: DonutSegment) => {
    if (!onDrilldown) return

    if (activePerspective === 'stage') {
      onDrilldown({ stage: segment.id as Stage })
    } else if (activePerspective === 'customer') {
      onDrilldown({ customerId: segment.id })
    } else if (activePerspective === 'model') {
      onDrilldown({ modelId: segment.id })
    }
    // Value perspective doesn't drill down further
  }

  return (
    <div className="w-full h-[450px] flex flex-col relative overflow-hidden">
      <DrilldownDonutChart
        data={donutData}
        title=""
        tabs={TABS}
        activeTab={activePerspective}
        onTabChange={handleTabChange}
        onSegmentSelect={handleSegmentSelect}
        onSegmentClick={handleSegmentClick}
        selectedSegmentId={selectedSegment?.id}
        detailData={detailData}
        valueFormatter={(v) =>
          activePerspective === 'value'
            ? `$${v.toLocaleString()}`
            : `${v} units`
        }
        className="h-full"
        height={420}
      />
    </div>
  )
}
