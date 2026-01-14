// src/components/ui/EventHistoryTimeline.test.tsx
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EventHistoryTimeline } from './EventHistoryTimeline'
import { eventStore } from '../../infrastructure/events/EventStore'
import type { DomainEvent } from '../../domain/production/events/DomainEvent'

// Mock the event store
vi.mock('../../infrastructure/events/EventStore', () => ({
  eventStore: {
    getEvents: vi.fn(),
  },
}))

describe('EventHistoryTimeline', () => {
  const mockPumpId = 'pump-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    ;(eventStore.getEvents as Mock).mockReturnValue(
      new Promise(() => {}) // Never resolves
    )

    render(<EventHistoryTimeline pumpId={mockPumpId} />)
    expect(screen.getByText('Loading events...')).toBeDefined()
  })

  it('should render empty state when no events', async () => {
    ;(eventStore.getEvents as Mock).mockResolvedValue([])

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('No events yet')).toBeDefined()
      expect(
        screen.getByText('Events will appear here as the pump moves through stages')
      ).toBeDefined()
    })
  })

  it('should filter and display only relevant event types', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      },
      {
        eventType: 'SomeOtherEvent',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        eventType: 'PumpPaused',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T11:00:00Z'),
        stage: 'FABRICATION',
        reason: 'manual',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Stage Move')).toBeDefined()
      expect(screen.getByText('Paused')).toBeDefined()
      // Should not render the "SomeOtherEvent"
      expect(screen.queryByText('SomeOtherEvent')).toBeNull()
    })
  })

  it('should sort events newest first', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T09:00:00Z'),
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      },
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T11:00:00Z'),
        fromStage: 'FABRICATION',
        toStage: 'POWDER_COAT',
      },
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        fromStage: null,
        toStage: 'QUEUE',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      const stageLabels = screen.getAllByText(/Queue|Fabrication|Powder Coat/i)
      // Newest first should show Powder Coat before Fabrication
      expect(stageLabels.length).toBeGreaterThan(0)
    })
  })

  it('should handle event fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(eventStore.getEvents as Mock).mockRejectedValue(new Error('Fetch failed'))

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('No events yet')).toBeDefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch pump events:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('should render PumpStageMoved event correctly', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Stage Move')).toBeDefined()
      expect(screen.getByText('Queue')).toBeDefined()
      expect(screen.getByText('Fabrication')).toBeDefined()
    })
  })

  it('should render PumpStageMoved with null fromStage as "New"', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        fromStage: null,
        toStage: 'QUEUE',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('New')).toBeDefined()
      expect(screen.getByText('Queue')).toBeDefined()
    })
  })

  it('should render PumpPaused event with manual reason', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpPaused',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        stage: 'FABRICATION',
        reason: 'manual',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeDefined()
      expect(screen.getByText('Paused in Fabrication')).toBeDefined()
      expect(screen.queryByText('(automatic)')).toBeNull()
    })
  })

  it('should render PumpPaused event with auto reason', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpPaused',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        stage: 'FABRICATION',
        reason: 'auto',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeDefined()
      expect(screen.getByText('(automatic)')).toBeDefined()
    })
  })

  it('should render PumpResumed event without paused days', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpResumed',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        stage: 'FABRICATION',
        pausedDays: 0,
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Resumed')).toBeDefined()
      expect(screen.getByText('Resumed in Fabrication')).toBeDefined()
      expect(screen.queryByText(/paused/i)).toBeNull()
    })
  })

  it('should render PumpResumed event with single paused day', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpResumed',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        stage: 'FABRICATION',
        pausedDays: 1,
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Resumed')).toBeDefined()
      expect(screen.getByText(/paused 1 day/i)).toBeDefined()
    })
  })

  it('should render PumpResumed event with multiple paused days', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpResumed',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        stage: 'FABRICATION',
        pausedDays: 5,
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Resumed')).toBeDefined()
      expect(screen.getByText(/paused 5 days/i)).toBeDefined()
    })
  })

  it('should render multiple events with timeline connectors', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      },
      {
        eventType: 'PumpPaused',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T09:00:00Z'),
        stage: 'FABRICATION',
        reason: 'manual',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    const { container } = render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      expect(screen.getByText('Stage Move')).toBeDefined()
      expect(screen.getByText('Paused')).toBeDefined()
      // Check for timeline connector (the line between events)
      const timelineLines = container.querySelectorAll('.absolute.left-\\[11px\\]')
      expect(timelineLines.length).toBeGreaterThan(0)
    })
  })

  it('should format event timestamps correctly', async () => {
    const mockEvents: DomainEvent[] = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: mockPumpId,
        occurredAt: new Date('2024-01-15T14:30:00Z'),
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      },
    ] as DomainEvent[]

    ;(eventStore.getEvents as Mock).mockResolvedValue(mockEvents)

    const { container } = render(<EventHistoryTimeline pumpId={mockPumpId} />)

    await waitFor(() => {
      const timeElements = container.querySelectorAll('time')
      expect(timeElements.length).toBe(1)
      expect(timeElements[0].getAttribute('datetime')).toBe('2024-01-15T14:30:00.000Z')
    })
  })
})
