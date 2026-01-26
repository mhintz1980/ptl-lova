import { addWeeks, startOfWeek } from 'date-fns'
import type { Pump, CapacityConfig } from '../types'
import { type StageDurations, type StageBlock } from './schedule'
import { countWorkingDays } from './working-days'
import { buildCapacityForecast } from './capacity-forecast'

export function buildCapacityAwareTimelines(
  pumps: Pump[],
  capacityConfig: CapacityConfig,
  leadTimeLookup: (model: string) => StageDurations | undefined
): Record<string, StageBlock[]> {
  const result: Record<string, StageBlock[]> = {}
  const powderCapacityByVendor = new Map<string, number>()
  const weeklyPowderCounts = new Map<string, Record<string, number>>()

  capacityConfig.powderCoat.vendors.forEach((vendor) => {
    powderCapacityByVendor.set(vendor.id, vendor.maxPumpsPerWeek)
    weeklyPowderCounts.set(vendor.id, {})
  })

  const pooledCapacity = capacityConfig.powderCoat.vendors.reduce(
    (sum, vendor) => sum + vendor.maxPumpsPerWeek,
    0
  )
  weeklyPowderCounts.set('pool', {})

  const scheduled = pumps.filter((pump) => pump.forecastStart)
  if (scheduled.length === 0) {
    return result
  }

  const earliestStart = scheduled.reduce((min, pump) => {
    const start = new Date(pump.forecastStart!)
    return start.getTime() < min.getTime() ? start : min
  }, new Date(scheduled[0].forecastStart!))

  const forecast = buildCapacityForecast({
    pumps: scheduled,
    capacityConfig,
    startDate: earliestStart,
    leadTimeLookup,
  })

  const entries: Array<{ pump: Pump; timeline: StageBlock[] }> = []

  scheduled.forEach((pump) => {
    const blocks = forecast.timelines[pump.id] ?? []
    const timeline = blocks.map((block) => ({
      stage: block.stage,
      start: block.start,
      end: block.end,
      days: countWorkingDays(block.start, block.end),
      pausedDays: block.pausedDays,
      pump,
    }))

    if (timeline.length > 0) {
      entries.push({ pump, timeline })
    }
  })

  const ordered = entries.sort((a, b) => {
    const aPowder = a.timeline.find((b) => b.stage === 'POWDER_COAT')
    const bPowder = b.timeline.find((b) => b.stage === 'POWDER_COAT')
    const aTime = aPowder?.start.getTime() ?? 0
    const bTime = bPowder?.start.getTime() ?? 0
    return aTime - bTime
  })

  ordered.forEach(({ pump, timeline }) => {
    const stagedIndex = timeline.findIndex(
      (block) => block.stage === 'STAGED_FOR_POWDER'
    )
    const powderIndex = timeline.findIndex(
      (block) => block.stage === 'POWDER_COAT'
    )
    if (stagedIndex < 0 || powderIndex < 0) {
      result[pump.id] = timeline
      return
    }

    const staged = timeline[stagedIndex]
    const powder = timeline[powderIndex]
    const vendorId =
      pump.powderCoatVendorId &&
      powderCapacityByVendor.has(pump.powderCoatVendorId)
        ? pump.powderCoatVendorId
        : 'pool'
    const weeklyCapacity =
      vendorId === 'pool'
        ? pooledCapacity
        : powderCapacityByVendor.get(vendorId) ?? pooledCapacity
    const weeklyCounts = weeklyPowderCounts.get(vendorId) ?? {}

    let powderStartCandidate = powder.start
    while (true) {
      const weekStart = startOfWeek(powderStartCandidate, { weekStartsOn: 1 })
      const weekKey = weekStart.toISOString().split('T')[0]
      const used = weeklyCounts[weekKey] ?? 0
      if (weeklyCapacity === 0 || used < weeklyCapacity) {
        weeklyCounts[weekKey] = used + 1
        break
      }
      powderStartCandidate = addWeeks(weekStart, 1)
    }
    weeklyPowderCounts.set(vendorId, weeklyCounts)

    if (powderStartCandidate.getTime() > powder.start.getTime()) {
      const newStagedDays = countWorkingDays(staged.start, powderStartCandidate)
      staged.days = newStagedDays
      staged.end = powderStartCandidate

      const deltaMs = powderStartCandidate.getTime() - powder.start.getTime()
      for (let i = powderIndex; i < timeline.length; i += 1) {
        const block = timeline[i]
        timeline[i] = {
          ...block,
          start: new Date(block.start.getTime() + deltaMs),
          end: new Date(block.end.getTime() + deltaMs),
        }
      }
    }

    result[pump.id] = timeline
  })

  return result
}
