import { useMemo } from 'react'
import { TrendAreaChart } from './TrendAreaChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'

export function ThroughputTrendChart({ filters, onDrilldown }: ChartProps) {
  const { pumps } = useApp()

  // Mocking getWeeklyThroughput logic here or verify kpiCalculators
  // Let's implement local logic for safety
  const data = useMemo(() => {
    // Group closed pumps by week
    const closed = pumps.filter((p) => p.stage === 'CLOSED') // Correct stage check

    // Simple map of Week -> Count
    const weeks: Record<string, number> = {}
    // Generate last 12 weeks keys
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      // simplified week key
      const k = `W${getWeekNum(d)}`
      weeks[k] = 0
    }

    closed.forEach((p) => {
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
  }, [pumps])

  return (
    <TrendAreaChart
      data={data}
      color="#d946ef" // Magenta
      filters={filters}
      onDrilldown={onDrilldown}
    />
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
