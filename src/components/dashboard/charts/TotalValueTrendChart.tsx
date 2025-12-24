import { useMemo } from 'react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { formatCurrency } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { SparklineAreaChart, SparklineDataPoint } from './SparklineAreaChart'

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

export function TotalValueTrendChart({ filters, onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  // Prepare sparkline data: aggregate value by week
  const chartData = useMemo((): SparklineDataPoint[] => {
    const weeksMap: Record<string, { total: number; count: number }> = {}

    // Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const k = `W${getWeekNum(d)}`
      weeksMap[k] = { total: 0, count: 0 }
    }

    // Bucket pumps by promise date week
    pumps.forEach((p) => {
      if (!p.promiseDate || p.stage === 'CLOSED' || p.stage === 'QUEUE') return
      if (filters.customerId && p.customer !== filters.customerId) return
      if (filters.modelId && p.model !== filters.modelId) return

      const d = new Date(p.promiseDate)
      const k = `W${getWeekNum(d)}`

      if (weeksMap[k]) {
        weeksMap[k].total += p.value || 0
        weeksMap[k].count += 1
      }
    })

    // Convert to sparkline format
    return Object.entries(weeksMap).map(([weekLabel, { total }]) => ({
      label: weekLabel,
      value: total,
    }))
  }, [pumps, filters])

  const handlePointClick = (_point: SparklineDataPoint) => {
    if (onDrilldown) {
      // Drill down to treemap/value breakdown
      onDrilldown({})
    }
  }

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>Projected Value by Week</span>
          <span className="text-xs font-normal opacity-70">
            Click to drill down
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] w-full px-0 pb-0">
        <SparklineAreaChart
          data={chartData}
          color="#06b6d4"
          height={200}
          valueFormatter={(val) => formatCurrency(val)}
          onPointClick={handlePointClick}
          showXAxis={true}
          showYAxis={false}
        />
      </CardContent>
    </Card>
  )
}
