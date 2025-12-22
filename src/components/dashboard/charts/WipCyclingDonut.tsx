import { useMemo } from 'react'
import { CyclingDonutChart, PerspectiveData } from './CyclingDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getPumpsByCustomer, getWorkloadByStage } from '../kpiCalculators'

// Helper to accumulate pumps by generic key
const groupPumps = (pumps: any[], keyFn: (p: any) => string) => {
  const map = new Map<string, number>()
  pumps.forEach((p) => {
    const k = keyFn(p)
    map.set(k, (map.get(k) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, id: name }))
    .sort((a, b) => b.value - a.value)
}

export function WipCyclingDonut({ filters, onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  const filteredPumps = useMemo(() => {
    return pumps.filter((p) => {
      if (p.stage === 'CLOSED') return false

      if (filters.customerId && p.customer !== filters.customerId) return false
      if (filters.modelId && p.model !== filters.modelId) return false
      if (filters.stage && p.stage !== filters.stage) return false
      return true
    })
  }, [pumps, filters])

  const perspectives = useMemo(() => {
    // 1. By Stage
    const stageData: PerspectiveData[] = getWorkloadByStage(filteredPumps).map(
      (s) => ({
        name: s.name,
        value: s.value,
        id: s.name,
      })
    )

    // 2. By Customer
    const customerData: PerspectiveData[] = getPumpsByCustomer(
      filteredPumps
    ).map((c) => ({
      name: c.name,
      value: c.value,
      id: c.name,
    }))

    // 3. By Model
    const modelData: PerspectiveData[] = groupPumps(
      filteredPumps,
      (p) => p.model
    )
      .map((m) => ({
        name: m.name,
        value: m.value,
        id: m.name,
      }))
      .slice(0, 10)

    return [
      { id: 'byStage', label: 'By Stage', data: stageData },
      { id: 'byCustomer', label: 'By Customer', data: customerData },
      { id: 'byModel', label: 'By Model', data: modelData },
    ]
  }, [filteredPumps])

  return (
    <CyclingDonutChart
      perspectives={perspectives}
      filters={filters}
      onDrilldown={onDrilldown}
      cycleInterval={8000}
    />
  )
}
