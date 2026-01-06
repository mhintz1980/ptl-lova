import { useMemo, useState } from 'react'
import {
  DrilldownDonutChart,
  DonutSegment,
  DetailRow,
} from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { differenceInCalendarDays, parseISO, isAfter } from 'date-fns'

// Risk status colors
const RISK_COLORS = {
  onTrack: '#22c55e', // Green
  atRisk: '#eab308', // Yellow
  late: '#ef4444', // Red
}

// Threshold: orders within 7 days of promise date are "at risk"
const AT_RISK_THRESHOLD_DAYS = 7

type RiskCategory = 'onTrack' | 'atRisk' | 'late'

interface PumpWithRisk {
  id: string
  po: string
  customer: string
  model: string
  stage: string
  promiseDate?: string
  riskCategory: RiskCategory
  daysUntilDue: number | null
}

export function OnTimeRiskChart(_props: ChartProps) {
  const { pumps } = useApp()
  const [selectedSegment, setSelectedSegment] = useState<DonutSegment | null>(
    null
  )

  // Categorize pumps by risk status
  const pumpsWithRisk = useMemo((): PumpWithRisk[] => {
    const now = new Date()

    return pumps
      .filter((p) => p.stage !== 'CLOSED')
      .map((p) => {
        let riskCategory: RiskCategory = 'onTrack'
        let daysUntilDue: number | null = null

        if (p.promiseDate) {
          const promiseDate = parseISO(p.promiseDate)
          daysUntilDue = differenceInCalendarDays(promiseDate, now)

          if (isAfter(now, promiseDate)) {
            // Past due
            riskCategory = 'late'
          } else if (daysUntilDue <= AT_RISK_THRESHOLD_DAYS) {
            // Due within threshold days
            riskCategory = 'atRisk'
          } else {
            // Comfortable buffer
            riskCategory = 'onTrack'
          }
        } else {
          // No promise date = on track (no deadline pressure)
          riskCategory = 'onTrack'
          daysUntilDue = null
        }

        return {
          ...p,
          riskCategory,
          daysUntilDue,
        }
      })
  }, [pumps])

  // Build donut segments
  const donutData = useMemo((): DonutSegment[] => {
    const counts = {
      onTrack: 0,
      atRisk: 0,
      late: 0,
    }

    pumpsWithRisk.forEach((p) => {
      counts[p.riskCategory]++
    })

    const segments: DonutSegment[] = []

    if (counts.onTrack > 0) {
      segments.push({
        id: 'onTrack',
        label: '🟢 On Track',
        value: counts.onTrack,
        color: RISK_COLORS.onTrack,
      })
    }

    if (counts.atRisk > 0) {
      segments.push({
        id: 'atRisk',
        label: '🟡 At Risk',
        value: counts.atRisk,
        color: RISK_COLORS.atRisk,
        sublabel: `Due ≤${AT_RISK_THRESHOLD_DAYS}d`,
      })
    }

    if (counts.late > 0) {
      segments.push({
        id: 'late',
        label: '🔴 Late',
        value: counts.late,
        color: RISK_COLORS.late,
      })
    }

    // If no segments at all, show placeholder
    if (segments.length === 0) {
      segments.push({
        id: 'empty',
        label: 'No active orders',
        value: 1,
        color: '#64748b',
      })
    }

    return segments
  }, [pumpsWithRisk])

  // Build inline detail data for selected risk category
  const detailData = useMemo((): DetailRow[] => {
    if (!selectedSegment || selectedSegment.id === 'empty') return []

    const matchingPumps = pumpsWithRisk.filter(
      (p) => p.riskCategory === selectedSegment.id
    )

    return matchingPumps.slice(0, 10).map((p) => {
      let valueStr = ''
      if (p.daysUntilDue !== null) {
        if (p.daysUntilDue < 0) {
          valueStr = `${Math.abs(p.daysUntilDue)}d late`
        } else if (p.daysUntilDue === 0) {
          valueStr = 'Due today'
        } else {
          valueStr = `${p.daysUntilDue}d left`
        }
      } else {
        valueStr = 'No date'
      }

      return {
        id: p.id,
        label: p.po,
        value: valueStr,
        sublabel: p.customer,
      }
    })
  }, [selectedSegment, pumpsWithRisk])

  const handleSegmentSelect = (segment: DonutSegment | null) => {
    setSelectedSegment(segment)
  }

  const handleSegmentClick = (_segment: DonutSegment) => {
    // Drill down to filtered view could be added here
    // For now, inline detail is sufficient
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <DrilldownDonutChart
        data={donutData}
        title=""
        onSegmentSelect={handleSegmentSelect}
        onSegmentClick={handleSegmentClick}
        selectedSegmentId={selectedSegment?.id}
        detailData={detailData}
        valueFormatter={(v) => `${v} orders`}
        height={420}
      />
    </div>
  )
}
