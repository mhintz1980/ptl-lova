import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
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

export function CycleTimeBreakdownChart(_props: ChartProps) {
  const { pumps } = useApp()
  const [drilldownPath, setDrilldownPath] = useState<string[]>([])

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

  // Get pumps in selected stage for drill-down
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (drilldownPath.length === 0) return []

    const selectedStage = drilldownPath[0] as Stage
    const pumpsInStage = pumps.filter((p) => p.stage === selectedStage)

    // Group by customer
    const customerMap = new Map<string, { count: number; totalAge: number }>()
    pumpsInStage.forEach((pump) => {
      if (!customerMap.has(pump.customer)) {
        customerMap.set(pump.customer, { count: 0, totalAge: 0 })
      }
      const data = customerMap.get(pump.customer)!
      data.count += 1
      // Calculate age in days using last_update
      if (pump.last_update) {
        const ageInMs = Date.now() - new Date(pump.last_update).getTime()
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
        data.totalAge += ageInDays
      }
    })

    return Array.from(customerMap.entries())
      .map(([customer, data]) => ({
        id: customer,
        label: customer,
        value: Math.round(data.totalAge * 10) / 10,
        color: STAGE_COLORS[selectedStage] || '#6b7280',
        sublabel: `${data.count} pump${data.count === 1 ? '' : 's'}`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [drilldownPath, pumps, stageData])

  const handleSegmentClick = (segment: DonutSegment | DrilldownSegment) => {
    if (drilldownPath.length === 0) {
      // Drill down to stage details
      setDrilldownPath([segment.id])
    }
    // No action at deepest level
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([])
    }
  }

  const getTitle = () => {
    if (drilldownPath.length === 0) return 'Cycle Time By Stage'
    return `Pumps in ${drilldownPath[0].replace(/_/g, ' ')}`
  }

  return (
    <div className="w-full h-full flex flex-col min-h-[300px]">
      <AnimatePresence mode="wait">
        {drilldownPath.length === 0 ? (
          <motion.div
            key="donut"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <DrilldownDonutChart
              data={donutData}
              title={getTitle()}
              onSegmentClick={handleSegmentClick}
              valueFormatter={(v) => `${v.toFixed(1)} days`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="drilldown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <DrilldownChart3D
              data={drilldownData}
              title={getTitle()}
              breadcrumbs={drilldownPath}
              onBreadcrumbClick={handleBreadcrumbClick}
              valueFormatter={(v) => `${v.toFixed(1)} days`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
