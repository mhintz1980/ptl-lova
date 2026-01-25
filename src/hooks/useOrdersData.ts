import { useMemo } from 'react'
import { useApp } from '../store'
import {
  STAGE_SEQUENCE,
  STAGE_LABELS,
  STAGE_COLORS,
} from '../lib/stage-constants'
import type { DigitalDnaStrand, DnaSegment } from '../types/dna'
import type { Pump } from '../types'

export const useOrdersData = () => {
  const { pumps, loading } = useApp()

  const strands: DigitalDnaStrand[] = useMemo(() => {
    // 1. Group pumps by PO
    const pumpsByPo = pumps.reduce(
      (acc, pump) => {
        const po = pump.po
        if (!acc[po]) {
          acc[po] = []
        }
        acc[po].push(pump)
        return acc
      },
      {} as Record<string, Pump[]>
    )

    // 2. Transform into DNA Strands
    return Object.entries(pumpsByPo).map(([poId, poPumps]) => {
      const totalPumps = poPumps.length

      // Calculate start/end dates
      // Start: Earliest forecastStart or dateReceived
      // End: Latest forecastEnd or promiseDate
      // (Simplified for now - just taking raw values if available)
      const startDate = poPumps
        .map((p) => p.forecastStart || p.dateReceived)
        .filter(Boolean)
        .sort()[0]

      const endDate = poPumps
        .map((p) => p.forecastEnd || p.promiseDate)
        .filter(Boolean)
        .sort()
        .reverse()[0]

      // Generate Segments
      const segments: DnaSegment[] = STAGE_SEQUENCE.map((stageId, index) => {
        const stageIndex = index

        let completedCount = 0
        let activeCount = 0
        let hasIssues = false

        poPumps.forEach((pump) => {
          const pumpStageIndex = STAGE_SEQUENCE.indexOf(pump.stage)
          if (pumpStageIndex > stageIndex) {
            completedCount++
          } else if (pumpStageIndex === stageIndex) {
            activeCount++
            // Check issues: Paused?
            if (pump.isPaused) {
              hasIssues = true
            }
          }
        })

        const completionRatio = totalPumps > 0 ? completedCount / totalPumps : 0
        const activeRatio = totalPumps > 0 ? activeCount / totalPumps : 0

        return {
          id: `${poId}-${stageId}`,
          stage: stageId,
          label: STAGE_LABELS[stageId].substring(0, 3).toUpperCase(), // Short label
          totalCount: totalPumps,
          completedCount,
          activeCount,
          completionRatio,
          activeRatio,
          colorClass: STAGE_COLORS[stageId],
          hasIssues,
          isBlocked: false, // TODO: data-driven blocking check ??
        }
      })

      // Calculate Overall Progress
      // Simple average of segment completion?
      // Or (Count of pumps * Weight of their stage) / Max Weight?
      // Let's go with percent of total pumps that are CLOSED
      const closedCount = poPumps.filter((p) => p.stage === 'CLOSED').length
      const overallProgress = totalPumps > 0 ? closedCount / totalPumps : 0
      const totalValue = poPumps.reduce((sum, p) => sum + (p.value || 0), 0)

      // Late check
      // Logic: If today > promiseDate and not closed
      const isLate = poPumps.some((p) => {
        if (p.stage === 'CLOSED') return false
        if (!p.promiseDate) return false
        return new Date(p.promiseDate) < new Date() // Past due
      })

      return {
        id: poId,
        poNumber: poId,
        customer: poPumps[0]?.customer || 'Unknown',
        startDate,
        endDate,
        segments,
        pumps: poPumps,
        overallProgress,
        totalValue,
        isLate,
      }
    })
  }, [pumps])

  return {
    orders: strands,
    loading,
  }
}
