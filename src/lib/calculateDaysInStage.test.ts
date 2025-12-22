/**
 * calculateDaysInPreviousStage tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { calculateDaysInPreviousStage } from './calculateDaysInStage'
import { EVENTS_STORAGE_KEY } from '../infrastructure/events/EventStore'

describe('calculateDaysInPreviousStage', () => {
  beforeEach(() => {
    localStorage.removeItem(EVENTS_STORAGE_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(EVENTS_STORAGE_KEY)
  })

  it('should return null for first move (no fromStage)', () => {
    const result = calculateDaysInPreviousStage(
      'pump-1',
      null,
      new Date('2025-01-05T10:00:00Z')
    )
    expect(result).toBeNull()
  })

  it('should return null when no entry event exists', () => {
    // No events in storage, so no entry event can be found
    const result = calculateDaysInPreviousStage(
      'pump-1',
      'QUEUE',
      new Date('2025-01-05T10:00:00Z')
    )
    expect(result).toBeNull()
  })

  it('should calculate correct days between events', () => {
    // Seed an entry event (pump entered FABRICATION 3 days ago)
    const entryDate = new Date('2025-01-02T10:00:00Z')
    const exitDate = new Date('2025-01-05T10:00:00Z') // 3 days later

    const events = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: 'pump-1',
        pumpId: 'pump-1',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        occurredAt: entryDate.toISOString(),
      },
    ]
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))

    const result = calculateDaysInPreviousStage(
      'pump-1',
      'FABRICATION',
      exitDate
    )

    expect(result).toBeCloseTo(3.0, 1)
  })

  it('should use most recent entry event when multiple exist', () => {
    // Pump entered FABRICATION twice
    const firstEntry = new Date('2025-01-01T10:00:00Z')
    const secondEntry = new Date('2025-01-05T10:00:00Z')
    const exitDate = new Date('2025-01-07T10:00:00Z') // 2 days after second entry

    const events = [
      {
        eventType: 'PumpStageMoved',
        aggregateId: 'pump-1',
        pumpId: 'pump-1',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        occurredAt: firstEntry.toISOString(),
      },
      {
        eventType: 'PumpStageMoved',
        aggregateId: 'pump-1',
        pumpId: 'pump-1',
        fromStage: 'ASSEMBLY',
        toStage: 'FABRICATION',
        occurredAt: secondEntry.toISOString(),
      },
    ]
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))

    const result = calculateDaysInPreviousStage(
      'pump-1',
      'FABRICATION',
      exitDate
    )

    // Should use second entry (2 days), not first (6 days)
    expect(result).toBeCloseTo(2.0, 1)
  })
})
