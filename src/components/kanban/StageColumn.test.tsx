import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StageColumn } from './StageColumn'
import { useApp } from '../../store'
import type { Pump } from '../../types'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

const basePump: Pump = {
  id: 'pump-1',
  serial: 1001,
  po: 'PO-001',
  customer: 'Customer A',
  model: 'Model X',
  stage: 'FABRICATION',
  priority: 'Normal',
  last_update: new Date().toISOString(),
  value: 5000,
}

const resetStore = () => {
  useApp.setState((state) => ({
    collapsedStages: {
      QUEUE: false,
      FABRICATION: false,
      STAGED_FOR_POWDER: false,
      POWDER_COAT: false,
      ASSEMBLY: false,
      SHIP: false,
      CLOSED: false,
    },
    wipLimits: {
      ...state.wipLimits,
      FABRICATION: 2,
    },
  }))
}

describe('StageColumn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'))
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows count vs wip limit', () => {
    const pumps: Pump[] = [0, 1, 2].map((offset) => ({
      ...basePump,
      id: `pump-${offset}`,
      last_update: new Date(Date.UTC(2024, 0, 7 + offset)).toISOString(),
    }))

    render(<StageColumn stage="FABRICATION" pumps={pumps} collapsed={false} />)

    // Verify count vs WIP limit is displayed
    expect(screen.getByText('3 / 2')).toBeTruthy()
  })

  it('marks the header as overloaded when count exceeds limit', () => {
    const pumps: Pump[] = [
      basePump,
      { ...basePump, id: 'pump-2' },
      { ...basePump, id: 'pump-3' },
    ]

    const { container } = render(
      <StageColumn stage="FABRICATION" pumps={pumps} collapsed={false} />
    )

    const header = container.querySelector('[data-stage-header="FABRICATION"]')
    expect(header).not.toBeNull()
    expect(header?.getAttribute('data-over-limit')).toBe('true')
  })

  it('shows empty state message when column has no pumps', () => {
    render(<StageColumn stage="FABRICATION" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No pumps in fabrication. Drag from Queue to start production.')
    ).toBeTruthy()
  })

  it('does not show empty state when column has pumps', () => {
    render(<StageColumn stage="FABRICATION" pumps={[basePump]} collapsed={false} />)

    expect(
      screen.queryByText('No pumps in fabrication. Drag from Queue to start production.')
    ).toBeNull()
  })

  it('shows correct empty state message for QUEUE stage', () => {
    render(<StageColumn stage="QUEUE" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No orders in queue. Add a new PO to get started.')
    ).toBeTruthy()
  })

  it('shows correct empty state message for STAGED_FOR_POWDER stage', () => {
    render(<StageColumn stage="STAGED_FOR_POWDER" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No pumps staged. Items here await powder coating.')
    ).toBeTruthy()
  })

  it('shows correct empty state message for POWDER_COAT stage', () => {
    render(<StageColumn stage="POWDER_COAT" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No pumps at powder coat. Items are at external vendor.')
    ).toBeTruthy()
  })

  it('shows correct empty state message for ASSEMBLY stage', () => {
    render(<StageColumn stage="ASSEMBLY" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No pumps in assembly. Drag completed fabrication here.')
    ).toBeTruthy()
  })

  it('shows correct empty state message for SHIP stage', () => {
    render(<StageColumn stage="SHIP" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No pumps ready to ship. Complete assembly to ship orders.')
    ).toBeTruthy()
  })

  it('shows correct empty state message for CLOSED stage', () => {
    render(<StageColumn stage="CLOSED" pumps={[]} collapsed={false} />)

    expect(
      screen.getByText('No completed orders. Shipped orders appear here.')
    ).toBeTruthy()
  })

  it('does not show empty state when column is collapsed', () => {
    useApp.setState((state) => ({
      collapsedStages: {
        ...state.collapsedStages,
        FABRICATION: true,
      },
    }))

    const { container } = render(
      <StageColumn stage="FABRICATION" pumps={[]} collapsed={false} />
    )

    // When collapsed, the empty state should not be rendered
    expect(
      screen.queryByText('No pumps in fabrication. Drag from Queue to start production.')
    ).toBeNull()

    // Verify the column content area is not rendered when collapsed
    const contentArea = container.querySelector('.space-y-3')
    expect(contentArea).toBeNull()
  })
})
