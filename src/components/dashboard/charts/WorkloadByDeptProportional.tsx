import { useMemo } from 'react'
import { ProportionalBarChart } from './ProportionalBarChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getCapacityByDept } from '../kpiCalculators'

// Mapping department names to colors (optional) or keeping default cyan
const DEPT_COLORS: Record<string, string> = {
  Fabrication: '#3b82f6', // blue
  'Powder Coat': '#f97316', // orange
  Assembly: '#22c55e', // green
  'Testing & Shipping': '#8b5cf6', // violet
}

export function WorkloadByDeptProportional({
  filters,
  onDrilldown,
}: ChartProps) {
  const { pumps } = useApp()

  // Assuming we might filter by model or customer if selected,
  // but usually Capacity is "All Active" or filtered subset.
  // Let's respect filters.
  const filteredPumps = useMemo(() => {
    return pumps.filter((p) => {
      if (p.stage === 'CLOSED') return false // Capacity usually active only
      if (filters.customerId && p.customer !== filters.customerId) return false
      if (filters.modelId && p.model !== filters.modelId) return false
      // filters.stage? If we filter by stage, we arguably only show that dept?
      // But usually this chart IS the stage breakdown.
      // Let's show all depts but filtered content.
      return true
    })
  }, [pumps, filters])

  const data = useMemo(() => {
    const raw = getCapacityByDept(filteredPumps)
    return raw.map((r) => ({
      id: r.name,
      name: r.name, // "Fabrication", etc.
      value: r.value, // count
      limit: r.limit,
      color: DEPT_COLORS[r.name] || '#06b6d4',
    }))
  }, [filteredPumps])

  return (
    <ProportionalBarChart
      items={data}
      filters={filters}
      onDrilldown={onDrilldown}
    />
  )
}
