import { useMemo } from 'react'
import { WorkloadDonutChart } from './WorkloadDonutChart'
import { ModelTreemapChart } from './ModelTreemapChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { applyDashboardFilters } from '../utils'

/**
 * Composite panel containing both 3D drill-down charts:
 * - WorkloadDonutChart: Customer → PO → Completion
 * - ModelTreemapChart: Model → Customer → Status
 */
export function DrilldownChartsPanel({ filters, onDrilldown }: ChartProps) {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <WorkloadDonutChart pumps={filteredPumps} onDrilldown={onDrilldown} />
      <ModelTreemapChart pumps={filteredPumps} onDrilldown={onDrilldown} />
    </div>
  )
}

// Export for chart registry
export const DrilldownChartsPanelWrapper = DrilldownChartsPanel
