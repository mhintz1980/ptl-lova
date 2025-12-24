// src/components/dashboard/ValueChart.tsx
import React, { useMemo, useState } from 'react'
import { Pump } from '../../types'
import { DrilldownDonutChart, DonutSegment } from './charts/DrilldownDonutChart'
import { ChartProps, DashboardFilters } from './dashboardConfig'
import { useApp } from '../../store'
import { applyDashboardFilters } from './utils'

interface ValueChartProps {
  pumps: Pump[]
  type: 'customer' | 'model'
  headless?: boolean
  onDrilldown?: (update: Partial<DashboardFilters>) => void
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

type Perspective = 'customer' | 'model'

const TABS: { id: Perspective; label: string }[] = [
  { id: 'customer', label: 'By Customer' },
  { id: 'model', label: 'By Model' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const aggregatePoValue = (pumps: Pump[], type: 'customer' | 'model') => {
  const groups = pumps.reduce((acc, pump) => {
    const key = type === 'customer' ? pump.customer : pump.model
    if (!acc[key]) {
      acc[key] = 0
    }
    acc[key] += pump.value || 0
    return acc
  }, {} as Record<string, number>)

  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

export const ValueChart: React.FC<ValueChartProps> = ({
  pumps,
  onDrilldown,
}) => {
  const [activePerspective, setActivePerspective] =
    useState<Perspective>('customer')

  const donutData = useMemo((): DonutSegment[] => {
    const raw = aggregatePoValue(pumps, activePerspective)
    return raw.map((item, i) => ({
      id: item.name,
      label: item.name,
      value: item.value,
      color: COLORS[i % COLORS.length],
    }))
  }, [pumps, activePerspective])

  const handleSegmentClick = (segment: DonutSegment) => {
    if (!onDrilldown) return

    if (activePerspective === 'customer') {
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
          valueFormatter={(v) => formatCurrency(v)}
        />
      </div>
    </div>
  )
}

export const ValueByCustomerChart: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )
  return (
    <ValueChart
      pumps={filteredPumps}
      type="customer"
      headless={true}
      onDrilldown={onDrilldown}
    />
  )
}

export const ValueByModelChart: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )
  return (
    <ValueChart
      pumps={filteredPumps}
      type="model"
      headless={true}
      onDrilldown={onDrilldown}
    />
  )
}
