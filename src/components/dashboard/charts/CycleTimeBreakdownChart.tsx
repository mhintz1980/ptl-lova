import { useState, useMemo } from 'react'
import {
  DrilldownDonutChart,
  DonutSegment,
  DetailRow,
} from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getAverageStageAge } from '../kpiCalculators'

// Stage colors with bottleneck (red) highlighting
const STAGE_COLORS: Record<string, string> = {
  QUEUE: '#94a3b8',
  FABRICATION: '#0ea5e9',
  POWDER_COAT: '#d946ef',
  ASSEMBLY: '#f97316',
  TESTING: '#fb7185',
  SHIPPING: '#22c55e',
}

const BOTTLENECK_COLOR = '#ef4444' // Red for bottleneck

export function CycleTimeBreakdownChart(_props: ChartProps) {
  const { pumps } = useApp()
  const [selectedSegment, setSelectedSegment] = useState<DonutSegment | null>(
    null
  )

  // Calculate average days per stage
  const stageData = useMemo(() => {
    return getAverageStageAge(pumps)
  }, [pumps])

  // Find bottleneck (max age)
  const maxAge = Math.max(...stageData.map((d) => d.age), 0)

  // Convert to donut segments
  const donutData = useMemo((): DonutSegment[] => {
    return stageData
      .filter((item) => item.age > 0) // Only show stages with time
      .map((item) => {
        const isBottleneck = item.age === maxAge && item.age > 0
        return {
          id: item.stage,
          label: item.stage.replace(/_/g, ' '),
          value: Math.round(item.age * 10) / 10, // Round to 1 decimal
          color: isBottleneck
            ? BOTTLENECK_COLOR
            : STAGE_COLORS[item.stage] || '#6b7280',
          sublabel: isBottleneck ? '⚠️ Bottleneck' : undefined,
        }
      })
  }, [stageData, maxAge])

  // Build inline detail data - pumps in selected stage
  const detailData = useMemo((): DetailRow[] => {
    if (!selectedSegment) return []

    const pumpsInStage = pumps.filter(
      (p) => p.stage === selectedSegment.id && p.stage !== 'CLOSED'
    )

    return pumpsInStage.slice(0, 10).map((p) => {
      // Calculate age in days
      let ageStr = ''
      if (p.last_update) {
        const ageInMs = Date.now() - new Date(p.last_update).getTime()
        const ageInDays = Math.round(ageInMs / (1000 * 60 * 60 * 24))
        ageStr = `${ageInDays}d`
      }

      return {
        id: p.id,
        label: p.po,
        value: ageStr,
        sublabel: p.customer,
      }
    })
  }, [selectedSegment, pumps])

  const handleSegmentSelect = (segment: DonutSegment | null) => {
    setSelectedSegment(segment)
  }

  return (
    <div className="w-full h-[375px] flex flex-col relative overflow-hidden">
      <DrilldownDonutChart
        data={donutData}
        title=""
        onSegmentSelect={handleSegmentSelect}
        selectedSegmentId={selectedSegment?.id}
        detailData={detailData}
        valueFormatter={(v) => `${v.toFixed(1)} days`}
        height={375}
      />
    </div>
  )
}
