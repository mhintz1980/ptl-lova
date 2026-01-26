import { useMemo } from 'react'
import { useApp } from '../store'
import { STAGE_ORDER, getStageColor, type DigitalDnaStrand } from '../types/dna'
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
        .filter((d): d is string => !!d)
        .reduce<string | undefined>((min, d) => {
          if (!min) return d
          return new Date(d).getTime() < new Date(min).getTime() ? d : min
        }, undefined)

      const endDate = poPumps
        .map((p) => p.forecastEnd || p.promiseDate)
        .filter((d): d is string => !!d)
        .reduce<string | undefined>((max, d) => {
          if (!max) return d
          return new Date(d).getTime() > new Date(max).getTime() ? d : max
        }, undefined)

      // Map pumps to visualization items
      const dnaItems = poPumps
        .map((pump) => ({
          id: pump.id,
          stage: pump.stage,
          // Use definitions from types/dna
          colorClass: getStageColor(pump.stage),
          sortOrder: STAGE_ORDER[pump.stage] ?? 999,
          // Determine if considered "complete" for visual styling if needed (though color handles most)
          isCompleted: pump.stage === 'CLOSED' || pump.stage === 'SHIP',
          hasIssues: !!pump.isPaused,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)

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
        dnaItems, // Replaced segments
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
