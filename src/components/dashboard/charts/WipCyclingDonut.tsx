import { useMemo, useState } from 'react'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getPumpsByCustomer, getWorkloadByStage } from '../kpiCalculators'
import { Stage } from '../../../types'

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

type Perspective = 'stage' | 'customer' | 'model'

const TABS: { id: Perspective; label: string }[] = [
  { id: 'stage', label: 'By Stage' },
  { id: 'customer', label: 'By Customer' },
  { id: 'model', label: 'By Model' },
]

// Helper to group pumps by key
function groupPumps(pumps: any[], keyFn: (p: any) => string) {
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
    return groupPumps(filteredPumps, (p) => p.model)
      .slice(0, 8)
      .map((m, i) => ({
        id: m.name,
        label: m.name,
        value: m.value,
        color: COLORS[i % COLORS.length],
      }))
  }, [filteredPumps, activePerspective])

  // Handle segment click → drill down
  const handleSegmentClick = (segment: DonutSegment) => {
    if (!onDrilldown) return

    if (activePerspective === 'stage') {
      onDrilldown({ stage: segment.id as Stage })
    } else if (activePerspective === 'customer') {
      onDrilldown({ customerId: segment.id })
    } else {
      onDrilldown({ modelId: segment.id })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Perspective Tabs */}
      <div className="flex gap-1 mb-3 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePerspective(tab.id)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
              ${
                activePerspective === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Donut Chart */}
      <div className="flex-1 min-h-0">
        <DrilldownDonutChart
          data={donutData}
          title=""
          onSegmentClick={handleSegmentClick}
          valueFormatter={(v) => `${v} units`}
        />
      </div>
    </div>
  )
}
