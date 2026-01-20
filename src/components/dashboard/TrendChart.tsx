// src/components/dashboard/TrendChart.tsx
import React from 'react'
import { Pump } from '../../types'
import { Card, CardContent } from '../ui/Card'
import { round } from '../../lib/format'
import { ChartProps, DashboardFilters } from './dashboardConfig'
import { useApp } from '../../store'
import { applyDashboardFilters } from './utils'
import {
  SparklineAreaChart,
  SparklineDataPoint,
} from './charts/SparklineAreaChart'

interface TrendChartProps {
  pumps: Pump[]
  headless?: boolean
  onDrilldown?: (update: Partial<DashboardFilters>) => void
}

function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `W${weekNo}`
}

function diffDays(pump: Pump): number {
  if (!pump.forecastEnd) return 0
  const start = new Date(pump.last_update)
  const end = new Date(pump.forecastEnd)
  return Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export const TrendChart: React.FC<TrendChartProps> = ({
  pumps,
  headless,
  onDrilldown,
}) => {
  const weeklyData = React.useMemo((): SparklineDataPoint[] => {
    const closed = pumps.filter((p) => p.stage === 'CLOSED' && p.forecastEnd)

    const weeklyStats = closed.reduce(
      (acc, pump) => {
        const week = getWeekNumber(new Date(pump.last_update))
        const buildTime = diffDays(pump)

        if (!acc[week]) {
          acc[week] = { total: 0, count: 0, week }
        }
        acc[week].total += buildTime
        acc[week].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number; week: string }>
    )

    // Convert to sparkline format and sort by week
    return Object.values(weeklyStats)
      .map((stat) => ({
        label: stat.week,
        value: round(stat.total / stat.count, 1),
        count: stat.count,
      }))
      .sort((a, b) => {
        const weekA = parseInt(a.label.substring(1))
        const weekB = parseInt(b.label.substring(1))
        return weekA - weekB
      })
  }, [pumps])

  const handlePointClick = (_point: SparklineDataPoint) => {
    if (onDrilldown) {
      // Drill down to PumpTable
      onDrilldown({})
    }
  }

  const Content =
    weeklyData.length > 0 ? (
      <SparklineAreaChart
        data={weeklyData}
        color="#d946ef"
        height={headless ? 200 : 240}
        valueFormatter={(val) => `${val} days`}
        onPointClick={handlePointClick}
        showXAxis={true}
        showYAxis={false}
      />
    ) : (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No completed pumps with build time data</p>
      </div>
    )

  if (headless) {
    return <div className="h-full w-full">{Content}</div>
  }

  return (
    <Card className="layer-l1">
      <CardContent>{Content}</CardContent>
    </Card>
  )
}

export const LeadTimeTrendChart: React.FC<ChartProps> = ({
  filters,
  onDrilldown,
}) => {
  const pumps = useApp((state) => state.pumps)
  const filteredPumps = React.useMemo(
    () => applyDashboardFilters(pumps, filters),
    [pumps, filters]
  )
  return (
    <TrendChart
      pumps={filteredPumps}
      headless={true}
      onDrilldown={onDrilldown}
    />
  )
}
