import { describe, it, expect } from 'vitest'
import { buildStageTimeline } from '../src/lib/schedule'
import { StageDurations } from '../src/lib/schedule'
import { Pump } from '../src/types'
import { addDays, startOfDay } from 'date-fns'

describe('Timeline Rendering Debug', () => {
  const mockLeadTimes: StageDurations = {
    fabrication: 1,
    powder_coat: 1,
    assembly: 1,
    ship: 1,
  }

  const today = startOfDay(new Date())
  const promiseDate = addDays(today, -5) // Late!

  const pump: Pump = {
    id: 'test-pump',
    model: 'Test Model',
    po: 'PO123',
    customer: 'Test Customer',
    stage: 'QUEUE',
    priority: 'Normal',
    serial: null,
    value: 1000,
    promiseDate: promiseDate.toISOString(),
    forecastStart: today.toISOString(),
    last_update: today.toISOString(),
  }

  it('generates valid timeline blocks', () => {
    const timeline = buildStageTimeline(pump, mockLeadTimes, {
      startDate: new Date(pump.forecastStart!),
    })

    console.log('generated timeline:', timeline)
    expect(timeline.length).toBeGreaterThan(0)
    timeline.forEach((block) => {
      expect(block.days).toBeGreaterThan(0)
    })
  })

  it('simulates UnifiedJobPill segment calculation', () => {
    const timeline = buildStageTimeline(pump, mockLeadTimes, {
      startDate: new Date(pump.forecastStart!),
    })

    // Simulate UnifiedJobPill logic
    const viewStart = today
    const totalDays = 42
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    if (!timeline.length) throw new Error('No timeline')

    const firstBlock = timeline[0]
    const lastBlock = timeline[timeline.length - 1]

    const pillStart =
      (firstBlock.start.getTime() - viewStart.getTime()) / MS_PER_DAY
    const pillEnd = (lastBlock.end.getTime() - viewStart.getTime()) / MS_PER_DAY

    // Clamp to view range
    const clampedStart = Math.max(0, pillStart)
    const clampedEnd = Math.min(totalDays, pillEnd)

    const pillBounds = {
      startIndex: clampedStart,
      span: clampedEnd - clampedStart,
    }

    console.log('pillBounds:', pillBounds)

    const segments = timeline
      .map((block) => {
        // Calculate block position relative to pill, clamped to view
        const blockStart = Math.max(
          0,
          (block.start.getTime() - viewStart.getTime()) / MS_PER_DAY
        )
        const blockEnd = Math.min(
          totalDays,
          (block.end.getTime() - viewStart.getTime()) / MS_PER_DAY
        )

        // Position within the pill
        const offsetInPill = blockStart - pillBounds.startIndex
        const widthInPill = blockEnd - blockStart

        const widthPercent = (widthInPill / pillBounds.span) * 100

        console.log(
          `Block ${block.stage}: start=${blockStart}, end=${blockEnd}, widthInPill=${widthInPill}, widthPercent=${widthPercent}`
        )

        return {
          stage: block.stage,
          offsetPercent: (offsetInPill / pillBounds.span) * 100,
          widthPercent: widthPercent,
        }
      })
      .filter((seg) => seg.widthPercent > 0)

    console.log('Segments:', segments.length)
    expect(segments.length).toBeGreaterThan(0)
  })
})
