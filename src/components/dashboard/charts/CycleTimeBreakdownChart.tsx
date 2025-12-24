import { useMemo } from 'react'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { getAverageStageAge } from '../kpiCalculators'
import { Stage } from '../../../types'

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

export function CycleTimeBreakdownChart({ onDrilldown }: ChartProps) {
  const { pumps } = useApp()

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

  // Handle segment click → drill down by stage
  const handleSegmentClick = (segment: DonutSegment) => {
    if (onDrilldown) {
      onDrilldown({ stage: segment.id as Stage })
    }
  }

  return (
    <DrilldownDonutChart
      data={donutData}
      title="Cycle Time By Stage"
      onSegmentClick={handleSegmentClick}
      valueFormatter={(v) => `${v.toFixed(1)} days`}
    />
  )
}
