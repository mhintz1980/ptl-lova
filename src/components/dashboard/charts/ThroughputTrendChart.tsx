import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TrendAreaChart } from './TrendAreaChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'

// Consistent colors for models
const MODEL_COLORS = [
  '#d946ef', // magenta (primary)
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#10b981', // green
]

export function ThroughputTrendChart({
  filters,
  onDrilldown: _onDrilldown,
}: ChartProps) {
  const { pumps } = useApp()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  // Level 0: Trend Data (Weeks)
  const data = useMemo(() => {
    // Group closed pumps by week
    const closed = pumps.filter((p) => p.stage === 'CLOSED')

    // Apply filters
    const filteredClosed = closed.filter((p) => {
      if (filters.customerId && p.customer !== filters.customerId) return false
      if (filters.modelId && p.model !== filters.modelId) return false
      return true
    })

    // Simple map of Week -> Count
    const weeks: Record<string, number> = {}
    // Generate last 12 weeks keys
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const k = `W${getWeekNum(d)}`
      weeks[k] = 0
    }

    filteredClosed.forEach((p) => {
      // Assuming last_update is completion time for CLOSED items
      if (!p.last_update) return
      const d = new Date(p.last_update)
      const k = `W${getWeekNum(d)}`
      if (weeks[k] !== undefined) weeks[k]++
    })

    return Object.entries(weeks).map(([label, value]) => ({
      label,
      value,
    }))
  }, [pumps, filters])

  // Level 1: Drill-down Data (Model Breakdown for selected week)
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (!selectedWeek) return []

    const closed = pumps.filter((p) => p.stage === 'CLOSED')
    const modelMap = new Map<string, number>()

    closed.forEach((p) => {
      if (!p.last_update) return
      const d = new Date(p.last_update)
      const k = `W${getWeekNum(d)}`

      if (k === selectedWeek) {
        modelMap.set(p.model, (modelMap.get(p.model) || 0) + 1)
      }
    })

    return Array.from(modelMap.entries())
      .map(([model, count], index) => ({
        id: model,
        label: model,
        value: count,
        color: MODEL_COLORS[index % MODEL_COLORS.length],
        sublabel: `${count} units`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [pumps, selectedWeek])

  const handlePointClick = (point: { label: string; value: number }) => {
    setSelectedWeek(point.label)
  }

  return (
    <Card className="h-full border-none shadow-none bg-transparent flex flex-col overflow-hidden">
      <CardHeader className="px-0 pt-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>
            {selectedWeek
              ? `Completed Breakdown: ${selectedWeek}`
              : 'Throughput (Weekly)'}
          </span>
          {!selectedWeek && (
            <span className="text-xs font-normal opacity-70">
              Click to drill down
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[400px] w-full px-0 pb-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedWeek ? (
            <motion.div
              key="trend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <div className="w-full h-full">
                <TrendAreaChart
                  data={data}
                  color="#d946ef"
                  filters={filters}
                  onDrilldown={() => {}} // Handled internally
                  onPointClick={handlePointClick}
                />
              </div>
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
                title=""
                breadcrumbs={[selectedWeek]}
                onBreadcrumbClick={() => setSelectedWeek(null)}
                valueFormatter={(v) => `${v} units`}
                className="h-full flex flex-col overflow-y-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function getWeekNum(d: Date) {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}
