import { useMemo, useState } from 'react'
import {
  DrilldownDonutChart,
  DonutSegment,
  DetailRow,
} from './DrilldownDonutChart'
import { ChartProps, DashboardFilters } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getCapacityByDept } from '../kpiCalculators'

// Department colors
const DEPT_COLORS: Record<string, string> = {
  Fabrication: '#3b82f6', // blue
  'Powder Coat': '#f97316', // orange
  Assembly: '#22c55e', // green
  'Testing & Shipping': '#8b5cf6', // violet
}

// Map stages to departments
const STAGE_TO_DEPT: Record<string, string> = {
  QUEUE: 'Fabrication',
  FABRICATION: 'Fabrication',
  STAGED_FOR_POWDER: 'Powder Coat',
  POWDER_COAT: 'Powder Coat',
  ASSEMBLY: 'Assembly',
  SHIP: 'Testing & Shipping',
}

export function WorkloadByDeptProportional({
  filters,
  onDrilldown,
}: ChartProps) {
  const { pumps } = useApp()
  const [selectedSegment, setSelectedSegment] = useState<DonutSegment | null>(
    null
  )

  // Filter pumps
  const filteredPumps = useMemo(() => {
    return pumps.filter((p) => {
      if (p.stage === 'CLOSED') return false
      if (filters.customerId && p.customer !== filters.customerId) return false
      if (filters.modelId && p.model !== filters.modelId) return false
      return true
    })
  }, [pumps, filters])

  // Convert to donut data
  const donutData = useMemo((): DonutSegment[] => {
    const raw = getCapacityByDept(filteredPumps)
    return raw.map((r) => ({
      id: r.name,
      label: r.name,
      value: r.value,
      color: DEPT_COLORS[r.name] || '#06b6d4',
      sublabel: r.limit ? `Limit: ${r.limit}` : undefined,
    }))
  }, [filteredPumps])

  // Build inline detail data - pumps in selected department
  const detailData = useMemo((): DetailRow[] => {
    if (!selectedSegment) return []

    const pumpsInDept = filteredPumps.filter((p) => {
      const dept = STAGE_TO_DEPT[p.stage] || 'Unknown'
      return dept === selectedSegment.id
    })

    return pumpsInDept.slice(0, 10).map((p) => ({
      id: p.id,
      label: p.po,
      value: p.stage.replace(/_/g, ' '),
      sublabel: p.customer,
    }))
  }, [selectedSegment, filteredPumps])

  const handleSegmentSelect = (segment: DonutSegment | null) => {
    setSelectedSegment(segment)
  }

  const handleSegmentClick = (segment: DonutSegment) => {
    if (onDrilldown) {
      onDrilldown({ department: segment.id as DashboardFilters['department'] })
    }
  }

  return (
    <div className="w-full h-[375px] flex flex-col relative overflow-hidden">
      <DrilldownDonutChart
        data={donutData}
        title=""
        onSegmentSelect={handleSegmentSelect}
        onSegmentClick={handleSegmentClick}
        selectedSegmentId={selectedSegment?.id}
        detailData={detailData}
        valueFormatter={(v) => `${v} pumps`}
        height={375}
      />
    </div>
  )
}
