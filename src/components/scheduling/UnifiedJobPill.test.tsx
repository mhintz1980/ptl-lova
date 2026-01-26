import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UnifiedJobPill } from './UnifiedJobPill'
import type { Pump } from '../../types'

const basePump: Pump = {
  id: 'pump-1',
  serial: 1001,
  po: 'PO-100',
  customer: 'Acme',
  model: 'DD-4',
  stage: 'FABRICATION',
  priority: 'High',
  value: 1000,
  last_update: '2026-01-05T00:00:00.000Z',
}

describe('UnifiedJobPill', () => {
  it('renders a paused overlay when a segment has paused days', () => {
    const timeline = [
      {
        stage: 'FABRICATION' as const,
        start: new Date('2026-01-05T00:00:00.000Z'),
        end: new Date('2026-01-07T00:00:00.000Z'),
        days: 2,
        pausedDays: 1,
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

    expect(screen.getByTestId('calendar-segment-paused')).toBeInTheDocument()
  })

  it('shows an overdue badge when current stage exceeds its estimate', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T00:00:00.000Z'))

    const timeline = [
      {
        stage: 'FABRICATION' as const,
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

    vi.useRealTimers()
  })
})
