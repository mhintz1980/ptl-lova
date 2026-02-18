import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ClosedLane } from './ClosedLane'
import { useApp } from '../../store'
import type { Pump } from '../../types'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}))

const basePump: Pump = {
  id: 'pump-1',
  serial: 1001,
  po: 'PO-001',
  customer: 'Customer A',
  model: 'Model X',
  stage: 'CLOSED',
  priority: 'Normal',
  last_update: '2024-01-10T00:00:00.000Z',
  value: 5000,
}

describe('ClosedLane', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set system time to 2024-01-10
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('groups pumps by date correctly', () => {
    const pumps: Pump[] = [
      { ...basePump, id: 'p1', last_update: '2024-01-10T10:00:00Z' }, // Today
      { ...basePump, id: 'p2', last_update: '2024-01-09T10:00:00Z' }, // Yesterday
      { ...basePump, id: 'p3', last_update: '2024-01-07T10:00:00Z' }, // This Week
      { ...basePump, id: 'p4', last_update: '2023-12-25T10:00:00Z' }, // Older
    ]

    render(<ClosedLane stage="CLOSED" pumps={pumps} allPumps={pumps} />)

    expect(screen.getByText(/Today \(1\)/i)).toBeTruthy()
    expect(screen.getByText(/Yesterday \(1\)/i)).toBeTruthy()
    expect(screen.getByText(/This Week \(1\)/i)).toBeTruthy()
    expect(screen.getByText(/Older \(1\)/i)).toBeTruthy()
  })

  it('toggles group expansion', () => {
    const pumps: Pump[] = [
      { ...basePump, id: 'p1', last_update: '2024-01-10T10:00:00Z' },
    ]

    render(<ClosedLane stage="CLOSED" pumps={pumps} allPumps={pumps} />)

    // Initially expanded (default for Today is true in my implementation)
    expect(screen.getByText('Model X')).toBeTruthy()

    // Click to collapse
    fireEvent.click(screen.getByText(/Today \(1\)/i))
    expect(screen.queryByText('Model X')).toBeNull()
  })

  it('calls moveStage when reopen is clicked', () => {
    const pumps: Pump[] = [
      { ...basePump, id: 'p1', last_update: '2024-01-10T10:00:00Z' },
    ]
    const moveStageSpy = vi.fn()
    useApp.setState({ moveStage: moveStageSpy })

    render(<ClosedLane stage="CLOSED" pumps={pumps} allPumps={pumps} />)

    const reopenBtn = screen.getByTitle('Reopen Pump')
    fireEvent.click(reopenBtn)

    expect(moveStageSpy).toHaveBeenCalledWith('p1', 'SHIP')
  })
})
