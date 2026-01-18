import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { formatCompactCurrency } from '../../../lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { SparklineAreaChart, SparklineDataPoint } from './SparklineAreaChart'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'

// Get week label relative to now (W0 = this week, W-1 = last week, etc.)
function getRelativeWeekLabel(date: Date): string {
  const now = new Date()
  const nowWeekStart = new Date(now)
  nowWeekStart.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
  nowWeekStart.setHours(0, 0, 0, 0)

  const dateWeekStart = new Date(date)
  dateWeekStart.setDate(date.getDate() - date.getDay())
  dateWeekStart.setHours(0, 0, 0, 0)

  const weeksDiff = Math.round(
    (dateWeekStart.getTime() - nowWeekStart.getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  )

  // Return label like "W-3" for 3 weeks ago, "W0" for this week
  return weeksDiff >= 0 ? `W+${weeksDiff}` : `W${weeksDiff}`
}

// Consistent colors for customers (matching WorkloadDonut)
const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
]

export function TotalValueTrendChart({
  filters,
  onDrilldown: _onDrilldown,
}: ChartProps) {
  const { pumps } = useApp()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  // Prepare sparkline data: aggregate value by week
  const chartData = useMemo((): SparklineDataPoint[] => {
    const weeksMap: Record<string, { total: number; count: number }> = {}

    // Initialize last 12 weeks (W-11 to W0)
    for (let i = 11; i >= 0; i--) {
      weeksMap[`W-${i}`] = { total: 0, count: 0 }
    }

    // Bucket pumps by promise date week
    // Include ALL stages with promiseDate to show projected value
    pumps.forEach((p) => {
      if (!p.promiseDate) return
      if (filters.customerId && p.customer !== filters.customerId) return
      if (filters.modelId && p.model !== filters.modelId) return
      if (filters.stage && p.stage !== filters.stage) return

      const weekLabel = getRelativeWeekLabel(new Date(p.promiseDate))

      if (weeksMap[weekLabel] !== undefined) {
        weeksMap[weekLabel].total += p.value || 0
        weeksMap[weekLabel].count += 1
      }
    })

    // Convert to sparkline format
    return Object.entries(weeksMap)
      .sort(([a], [b]) => {
        // Sort W-11, W-10, ..., W-1, W0
        const aNum = parseInt(a.substring(1))
        const bNum = parseInt(b.substring(1))
        return aNum - bNum
      })
      .map(([weekLabel, { total }]) => ({
        label: weekLabel,
        value: total,
      }))
  }, [pumps, filters])

  // Drill-down data: Breakdown of value by customer for selected week
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (!selectedWeek) return []

    const customerMap = new Map<string, { value: number; count: number }>()

    pumps.forEach((p) => {
      if (!p.promiseDate) return

      const weekLabel = getRelativeWeekLabel(new Date(p.promiseDate))

      if (weekLabel === selectedWeek) {
        if (!customerMap.has(p.customer)) {
          customerMap.set(p.customer, { value: 0, count: 0 })
        }
        const data = customerMap.get(p.customer)!
        data.value += p.value || 0
        data.count += 1
      }
    })

    return Array.from(customerMap.entries())
      .map(([customer, data], index) => ({
        id: customer,
        label: customer,
        value: data.value,
        color: COLORS[index % COLORS.length],
        sublabel: `${data.count} pump${data.count === 1 ? '' : 's'}`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [pumps, selectedWeek])

  return (
    <Card className="h-full border-none shadow-none bg-transparent flex flex-col overflow-hidden">
      <CardHeader className="px-0 pt-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>
            {selectedWeek
              ? `Value Breakdown: ${selectedWeek}`
              : 'Projected Value by Week'}
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
              key="sparkline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <SparklineAreaChart
                data={chartData}
                color="#06b6d4"
                height={400}
                valueFormatter={(val) => formatCompactCurrency(val)}
                onPointClick={(point) => setSelectedWeek(point.label)}
                showXAxis={true}
                showYAxis={false}
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
                title=""
                breadcrumbs={[selectedWeek]}
                onBreadcrumbClick={() => setSelectedWeek(null)}
                valueFormatter={(v) => formatCompactCurrency(v)}
                className="h-full flex flex-col overflow-y-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
