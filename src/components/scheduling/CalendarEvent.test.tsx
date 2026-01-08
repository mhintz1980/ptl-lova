import { render, screen } from '@testing-library/react'
import { CalendarEvent } from './CalendarEvent'
import { CalendarStageEvent } from '../../lib/projection-engine'
import { describe, it, expect } from 'vitest'

describe('CalendarEvent', () => {
  const mockEvent: CalendarStageEvent = {
    id: 'test-event-1',
    pumpId: 'pump-1',
    stage: 'FABRICATION',
    title: 'Test Pump',
    subtitle: 'PO-123',
    week: 0,
    startDay: 0,
    span: 1,
    row: 0,
    startDate: new Date(),
    endDate: new Date(),
  }

  // Helper to get the wrapper element (parent of calendar-event)
  // Grid styles are on the wrapper, not the pill content
  const getWrapperElement = () => {
    const pillContent = screen.getByTestId('calendar-event')
    // Walk up: PillContent -> Tooltip -> Wrapper
    return pillContent.parentElement?.parentElement
  }

  it('renders with default full-day span', () => {
    // startDay: 0, span: 1
    // Expected: gridColumnEnd: span 1, marginLeft: 0%, width: 100%
    render(<CalendarEvent event={mockEvent} />)
    const wrapperEl = getWrapperElement()

    // In non-linearMode, grid styles are applied to the wrapper
    expect(wrapperEl?.style.gridColumnStart).toBe('1') // floor(0) + 1
    expect(wrapperEl?.style.gridColumnEnd).toBe('span 1') // ceil(1) - floor(0) = 1
    expect(wrapperEl?.style.marginLeft).toBe('0%')
    expect(wrapperEl?.style.width).toBe('100%')
  })

  it('renders correct fractional styles for half-day duration', () => {
    // startDay: 0, span: 0.5
    // Expected: gridColumnEnd: span 1, marginLeft: 0%, width: 50%
    const halfDayEvent = { ...mockEvent, span: 0.5 }
    render(<CalendarEvent event={halfDayEvent} />)
    const wrapperEl = getWrapperElement()

    // ceil(0.5) - floor(0) = 1 column
    expect(wrapperEl?.style.gridColumnEnd).toBe('span 1')
    expect(wrapperEl?.style.width).toBe('50%') // 0.5 / 1 * 100
  })

  it('renders correct fractional styles for offset start', () => {
    // startDay: 0.5, span: 0.5
    // Expected: starts in col 1, spans 1 col, margin 50%, width 50%
    const offsetEvent = { ...mockEvent, startDay: 0.5, span: 0.5 }
    render(<CalendarEvent event={offsetEvent} />)
    const wrapperEl = getWrapperElement()

    // gridColumnStart: floor(0.5) + 1 = 1
    expect(wrapperEl?.style.gridColumnStart).toBe('1')
    // totalSpan: ceil(0.5 + 0.5) - floor(0.5) = 1 - 0 = 1
    expect(wrapperEl?.style.gridColumnEnd).toBe('span 1')

    // marginLeft: (0.5 % 1) / 1 * 100 = 50%
    expect(wrapperEl?.style.marginLeft).toBe('50%')

    // width: 0.5 / 1 * 100 = 50%
    expect(wrapperEl?.style.width).toBe('50%')
  })

  it('renders correct styles for multi-day fractional span', () => {
    // startDay: 1.5, span: 1.5 (ends at 3.0)
    // Expected: starts col 2, spans 2 cols (2 & 3), margin 25% (of 2 cols?? no wait)

    // Logic:
    // gridColumnStart: floor(1.5) + 1 = 2
    // totalSpan: ceil(1.5 + 1.5) - floor(1.5) = 3 - 1 = 2

    // marginLeft: (1.5 % 1) / 2 * 100 = 0.5 / 2 * 100 = 25%
    // width: 1.5 / 2 * 100 = 75%

    const multiDayEvent = { ...mockEvent, startDay: 1.5, span: 1.5 }
    render(<CalendarEvent event={multiDayEvent} />)
    const wrapperEl = getWrapperElement()

    expect(wrapperEl?.style.gridColumnStart).toBe('2')
    expect(wrapperEl?.style.gridColumnEnd).toBe('span 2')
    expect(wrapperEl?.style.marginLeft).toBe('25%')
    expect(wrapperEl?.style.width).toBe('75%')
  })

  it('renders priority badge for Rush priority', () => {
    const rushEvent = { ...mockEvent, priority: 'Rush' as const }
    render(<CalendarEvent event={rushEvent} />)

    // Check for priority badge with 'R' label
    const pillContent = screen.getByTestId('calendar-event')
    expect(pillContent.getAttribute('data-priority')).toBe('Rush')
  })

  it('renders customer on secondary line for wide events', () => {
    const wideEvent = { ...mockEvent, span: 3, customer: 'United Rentals' }
    render(<CalendarEvent event={wideEvent} />)

    // Should show customer for spans >= 2 days
    expect(screen.getByText('United Rentals')).toBeInTheDocument()
  })
})
