/**
 * SchedulingService Unit Tests
 *
 * Tests the domain service for production scheduling projections.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SchedulingService,
  type StageDurations,
  type CapacityConfig,
  type PumpProjectionInput,
  type WorkHours,
} from './SchedulingService'

describe('SchedulingService', () => {
  let service: SchedulingService

  beforeEach(() => {
    service = new SchedulingService()
  })

  describe('resolveScheduleStart', () => {
    it('should use forecastStart when provided', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-15T00:00:00.000Z',
      }

      const result = service.resolveScheduleStart(pump, 10)

      // startOfDay uses local timezone, so check the date parts
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      // Date could be 14 or 15 depending on timezone offset
      expect(result.getDate()).toBeGreaterThanOrEqual(14)
      expect(result.getDate()).toBeLessThanOrEqual(15)
    })

    it('should backdate from forecastEnd when forecastStart not provided', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastEnd: '2025-01-31T00:00:00.000Z',
      }

      const result = service.resolveScheduleStart(pump, 10)

      // Should be ~10 business days before Jan 31
      expect(result.getTime()).toBeLessThan(new Date('2025-01-31').getTime())
    })

    it('should default to today when no forecast hints', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
      }

      const before = new Date()
      const result = service.resolveScheduleStart(pump, 10)
      const after = new Date()

      // Should be today (start of day)
      expect(result.getTime()).toBeGreaterThanOrEqual(
        new Date(before.toDateString()).getTime()
      )
      expect(result.getTime()).toBeLessThanOrEqual(
        new Date(after.toDateString()).getTime() + 24 * 60 * 60 * 1000
      )
    })
  })

  describe('buildProjection', () => {
    const defaultLeadTimes: StageDurations = {
      fabrication: 5,
      powder_coat: 3,
      assembly: 4,
      ship: 2,
      total_days: 14,
    }

    it('should generate timeline with all production stages', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const timeline = service.buildProjection(pump, defaultLeadTimes)

      expect(timeline.length).toBe(5)
      expect(timeline[0].stage).toBe('FABRICATION')
      expect(timeline[1].stage).toBe('STAGED_FOR_POWDER')
      expect(timeline[2].stage).toBe('POWDER_COAT')
      expect(timeline[3].stage).toBe('ASSEMBLY')
      expect(timeline[4].stage).toBe('SHIP')
    })

    it('should chain stage dates sequentially', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const timeline = service.buildProjection(pump, defaultLeadTimes)

      // Each stage should start when the previous ends
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].start.getTime()).toBe(timeline[i - 1].end.getTime())
      }
    })

    it('should filter to current stage onward for in-production pumps', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'ASSEMBLY', // Already in assembly
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const timeline = service.buildProjection(pump, defaultLeadTimes)

      expect(timeline.length).toBe(2) // Only ASSEMBLY and SHIP
      expect(timeline[0].stage).toBe('ASSEMBLY')
      expect(timeline[1].stage).toBe('SHIP')
    })

    it('should return empty timeline for CLOSED pumps', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'CLOSED',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const timeline = service.buildProjection(pump, defaultLeadTimes)

      // CLOSED is not in PRODUCTION_STAGES, so it filters everything out
      expect(timeline.length).toBe(0)
    })

    it('should use startDate option when provided', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z', // Should be ignored
      }

      const customStart = new Date('2025-06-15T12:00:00.000Z')
      const timeline = service.buildProjection(pump, defaultLeadTimes, {
        startDate: customStart,
      })

      // startOfDay normalizes to local timezone
      expect(timeline[0].start.getFullYear()).toBe(2025)
      expect(timeline[0].start.getMonth()).toBe(5) // June
      // Date could be 14 or 15 depending on timezone offset
      expect(timeline[0].start.getDate()).toBeGreaterThanOrEqual(14)
      expect(timeline[0].start.getDate()).toBeLessThanOrEqual(15)
    })

    it('should return read-only projections', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const timeline = service.buildProjection(pump, defaultLeadTimes)

      // Object.isFrozen checks if objects are truly read-only
      expect(Object.isFrozen(timeline[0])).toBe(true)
    })
  })

  describe('capacity-aware calculations', () => {
    const leadTimes: StageDurations = {
      fabrication: 5,
      powder_coat: 3,
      assembly: 4,
      ship: 2,
    }

    const capacityConfig: CapacityConfig = {
      fabrication: { dailyManHours: 32 },
      assembly: { dailyManHours: 24 },
      ship: { dailyManHours: 8 },
    }

    it('should adjust durations based on work hours and capacity', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'TEST-MODEL',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const workHours: WorkHours = {
        fabrication: 16, // 16h / 32h daily = 0.5 days
        assembly: 12, // 12h / 24h daily = 0.5 days
        ship: 4, // 4h / 8h daily = 0.5 days
      }

      const workHoursLookup = () => workHours

      const timeline = service.buildProjection(pump, leadTimes, {
        capacityConfig,
        workHoursLookup,
      })

      // Find fabrication block
      const fabBlock = timeline.find((b) => b.stage === 'FABRICATION')
      expect(fabBlock).toBeDefined()

      // 16h / 32h = 0.5 days, but minimum is 0.25
      expect(fabBlock!.days).toBe(0.5)
    })

    it('should keep powder coat at fixed duration', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-1',
        model: 'TEST-MODEL',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const workHours: WorkHours = {
        fabrication: 16,
        assembly: 12,
        ship: 4,
      }

      const timeline = service.buildProjection(pump, leadTimes, {
        capacityConfig,
        workHoursLookup: () => workHours,
      })

      const powderBlock = timeline.find((b) => b.stage === 'POWDER_COAT')
      expect(powderBlock!.days).toBe(3) // Original lead time, not capacity-adjusted
    })
  })

  describe('buildProjectionResult', () => {
    it('should return complete result with window', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-123',
        model: 'DD-6 SAFE',
        stage: 'QUEUE',
        forecastStart: '2025-01-01T12:00:00.000Z',
      }

      const leadTimes: StageDurations = {
        fabrication: 5,
        powder_coat: 3,
        assembly: 4,
        ship: 2,
      }

      const result = service.buildProjectionResult(pump, leadTimes)

      expect(result.pumpId).toBe('pump-123')
      expect(result.timeline.length).toBe(5)
      expect(result.window).not.toBeNull()
      // Window startISO contains a valid ISO date around Jan 1
      expect(result.window!.startISO).toMatch(/2024-12-3\d|2025-01-0\d/)
    })

    it('should return null window for empty timeline', () => {
      const pump: PumpProjectionInput = {
        id: 'pump-123',
        model: 'DD-6 SAFE',
        stage: 'CLOSED',
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      const leadTimes: StageDurations = {
        fabrication: 5,
        powder_coat: 3,
        assembly: 4,
        ship: 2,
      }

      const result = service.buildProjectionResult(pump, leadTimes)

      expect(result.timeline.length).toBe(0)
      expect(result.window).toBeNull()
    })
  })

  describe('getScheduleWindow', () => {
    it('should extract start and end ISO strings', () => {
      const timeline = [
        {
          stage: 'FABRICATION' as const,
          start: new Date('2025-01-01'),
          end: new Date('2025-01-06'),
          days: 5,
        },
        {
          stage: 'SHIP' as const,
          start: new Date('2025-01-06'),
          end: new Date('2025-01-08'),
          days: 2,
        },
      ]

      const window = service.getScheduleWindow(timeline)

      expect(window!.startISO).toContain('2025-01-01')
      expect(window!.endISO).toContain('2025-01-08')
    })

    it('should return null for empty timeline', () => {
      const window = service.getScheduleWindow([])
      expect(window).toBeNull()
    })
  })
})
