import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { UnifiedJobPill } from './UnifiedJobPill'
import type { Pump } from '../../types'
import { StageIds } from '../../lib/stage-constants'

const basePump: Pump = {
  id: 'pump-1',
  serial: 1001,
  po: 'PO-100',
  customer: 'Acme',
  model: 'DD-4',
  stage: StageIds.FABRICATION,
  priority: 'High',
  value: 1000,
  last_update: '2026-01-05T00:00:00.000Z',
}

afterEach(() => {
  vi.useRealTimers()
})

describe('UnifiedJobPill', () => {
  it('sizes the paused overlay relative to the segment width', () => {
    const timeline = [
      {
        stage: StageIds.FABRICATION,
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-03T00:00:00.000Z'),
        days: 2,
        pausedDays: 1,
        pump: basePump,
      },
      {
        stage: StageIds.ASSEMBLY,
        start: new Date('2026-01-03T00:00:00.000Z'),
        end: new Date('2026-01-05T00:00:00.000Z'),
        days: 2,
        pausedDays: 0,
        pump: basePump,
      },
    ]

    render(
      <UnifiedJobPill
        pump={basePump}
        timeline={timeline}
        viewStart={new Date('2026-01-01T00:00:00.000Z')}
        totalDays={14}
        rowIndex={0}
      />
    )

    expect(screen.getByTestId('calendar-segment-paused')).toHaveStyle({
      width: '50%',
    })
  })

  it('shows an overdue badge when current stage exceeds its estimate', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T00:00:00.000Z'))

    const timeline = [
      {
        stage: StageIds.FABRICATION,
        start: new Date('2026-01-05T00:00:00.000Z'),
        end: new Date('2026-01-07T00:00:00.000Z'),
        days: 2,
        pausedDays: 0,
        pump: basePump,
      },
    ]

    render(
      <UnifiedJobPill
        pump={basePump}
        timeline={timeline}
        viewStart={new Date('2026-01-05T00:00:00.000Z')}
        totalDays={14}
        rowIndex={0}
      />
    )

    expect(screen.getByTestId('stage-overdue')).toBeInTheDocument()
  })

  it('rerenders cleanly when the timeline becomes available', () => {
    const { rerender } = render(
      <UnifiedJobPill
        pump={basePump}
        timeline={[]}
        viewStart={new Date('2026-01-05T00:00:00.000Z')}
        totalDays={14}
        rowIndex={0}
      />
    )

    const timeline = [
      {
        stage: StageIds.FABRICATION,
        start: new Date('2026-01-05T00:00:00.000Z'),
        end: new Date('2026-01-07T00:00:00.000Z'),
        days: 2,
        pausedDays: 0,
        pump: basePump,
      },
    ]

    expect(() => {
      rerender(
        <UnifiedJobPill
          pump={basePump}
          timeline={timeline}
          viewStart={new Date('2026-01-05T00:00:00.000Z')}
          totalDays={14}
          rowIndex={0}
        />
      )
    }).not.toThrow()
  })
})
