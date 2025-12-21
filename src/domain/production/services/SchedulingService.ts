/**
 * SchedulingService - Domain Service for Production Scheduling Projections
 *
 * Constitution §7: Calendar is projection-only.
 * This service produces read-only projections from Pump forecast hints.
 * It NEVER mutates Pump state - only returns computed timeline projections.
 */

import { addBusinessDays, startOfDay } from 'date-fns'
import { Stage } from '../value-objects/Stage'

// ============================================================================
// Types
// ============================================================================

/**
 * Work hours required per stage for a pump model.
 * Provided by Product Catalog context.
 */
export interface WorkHours {
  fabrication: number
  assembly: number
  ship: number
}

/**
 * Lead time durations per stage (in days).
 * Provided by Product Catalog context.
 */
export interface StageDurations {
  fabrication: number
  powder_coat: number
  assembly: number
  ship: number
  total_days?: number
}

/**
 * Capacity configuration for work stages.
 * Provides dailyManHours for duration calculations.
 */
export interface StageCapacity {
  dailyManHours: number
}

export interface CapacityConfig {
  fabrication: StageCapacity
  assembly: StageCapacity
  ship: StageCapacity
}

/**
 * A single stage projection within a pump's timeline.
 * Read-only DTO - represents forecast, not truth.
 */
export interface StageProjection {
  readonly stage: Stage
  readonly start: Date
  readonly end: Date
  readonly days: number
}

/**
 * Complete projection result for a pump.
 * Constitution §7 compliant: read-only, never stored as truth.
 */
export interface ProjectionResult {
  readonly pumpId: string
  readonly timeline: readonly StageProjection[]
  readonly window: { readonly startISO: string; readonly endISO: string } | null
}

/**
 * Options for building projections.
 */
export interface ProjectionOptions {
  startDate?: Date
  capacityConfig?: CapacityConfig
  workHoursLookup?: (model: string) => WorkHours | undefined
}

/**
 * Minimal pump data needed for projection.
 * Uses plain object to maintain domain purity (no external type imports).
 */
export interface PumpProjectionInput {
  id: string
  model: string
  stage: Stage
  forecastStart?: string
  forecastEnd?: string
}

// ============================================================================
// Constants
// ============================================================================

/** Production stages that appear on the calendar timeline. */
const PRODUCTION_STAGES = [
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
] as const

type ProductionStage = (typeof PRODUCTION_STAGES)[number]
type StageKey = 'fabrication' | 'powder_coat' | 'assembly' | 'ship'

// Only work stages have StageKey mappings (STAGED_FOR_POWDER is buffer, no key)
const STAGE_TO_KEY: Partial<Record<ProductionStage, StageKey>> = {
  FABRICATION: 'fabrication',
  POWDER_COAT: 'powder_coat',
  ASSEMBLY: 'assembly',
  SHIP: 'ship',
}

// ============================================================================
// SchedulingService
// ============================================================================

/**
 * Domain Service for computing pump scheduling projections.
 *
 * Pure, stateless service - call methods directly or instantiate.
 */
export class SchedulingService {
  /**
   * Resolve the start date for a pump's projection.
   *
   * Priority:
   * 1. forecastStart hint (if set)
   * 2. Backdate from forecastEnd (if set)
   * 3. Default to today
   */
  resolveScheduleStart(pump: PumpProjectionInput, totalDays: number): Date {
    if (pump.forecastStart) {
      return startOfDay(new Date(pump.forecastStart))
    }

    if (pump.forecastEnd) {
      return startOfDay(addBusinessDays(new Date(pump.forecastEnd), -totalDays))
    }

    return startOfDay(new Date())
  }

  /**
   * Build a projection timeline for a pump.
   *
   * For in-production pumps (not QUEUE/CLOSED), only includes
   * current stage and future stages.
   *
   * @param pump - Pump data with forecast hints
   * @param leadTimes - Lead time durations per stage
   * @param options - Optional capacity config and work hours lookup
   * @returns Array of stage projections (read-only)
   */
  buildProjection(
    pump: PumpProjectionInput,
    leadTimes: StageDurations,
    options?: ProjectionOptions
  ): readonly StageProjection[] {
    // Sanitize and calculate durations
    let durations = this.sanitizeDurations(leadTimes)

    // Apply capacity-aware calculations if config and work hours available
    if (options?.capacityConfig && options?.workHoursLookup) {
      const workHours = options.workHoursLookup(pump.model)
      if (workHours) {
        durations = this.applyCapacityDurations(
          durations,
          workHours,
          options.capacityConfig
        )
      }
    }

    if (durations.length === 0) {
      return []
    }

    // For in-production pumps, filter to current stage onward
    const filteredDurations = this.filterForCurrentStage(pump.stage, durations)
    if (filteredDurations.length === 0) {
      return []
    }

    // Calculate timeline start
    const totalDays = filteredDurations.reduce((sum, d) => sum + d.days, 0)
    const timelineStart = startOfDay(
      options?.startDate ?? this.resolveScheduleStart(pump, totalDays)
    )

    // Build timeline
    return this.buildTimeline(filteredDurations, timelineStart)
  }

  /**
   * Build a complete projection result with window.
   */
  buildProjectionResult(
    pump: PumpProjectionInput,
    leadTimes: StageDurations,
    options?: ProjectionOptions
  ): ProjectionResult {
    const timeline = this.buildProjection(pump, leadTimes, options)
    const window = this.getScheduleWindow(timeline)

    return {
      pumpId: pump.id,
      timeline,
      window,
    }
  }

  /**
   * Get the schedule window (start/end ISO strings) from a timeline.
   */
  getScheduleWindow(
    timeline: readonly StageProjection[]
  ): { readonly startISO: string; readonly endISO: string } | null {
    if (timeline.length === 0) {
      return null
    }

    return {
      startISO: timeline[0].start.toISOString(),
      endISO: timeline[timeline.length - 1].end.toISOString(),
    }
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private sanitizeDurations(
    raw: StageDurations
  ): { stage: Stage; days: number }[] {
    return PRODUCTION_STAGES.map((stage) => {
      const key = STAGE_TO_KEY[stage]
      // Buffer stage (STAGED_FOR_POWDER) has no key - use 0 days
      const rawDays = key
        ? (raw as Record<StageKey, number | undefined>)[key]
        : 0
      return {
        stage,
        days: this.normalizeDays(rawDays),
      }
    })
  }

  private normalizeDays(value?: number): number {
    return Math.max(1, Math.ceil(value ?? 0))
  }

  private roundToHour(value: number): number {
    return Math.round(value * 24) / 24
  }

  private applyCapacityDurations(
    durations: { stage: Stage; days: number }[],
    workHours: WorkHours,
    config: CapacityConfig
  ): { stage: Stage; days: number }[] {
    return durations.map((d) => {
      let days = d.days

      if (d.stage === 'FABRICATION' && workHours.fabrication) {
        days = this.roundToHour(
          workHours.fabrication / config.fabrication.dailyManHours
        )
      } else if (d.stage === 'ASSEMBLY' && workHours.assembly) {
        days = this.roundToHour(
          workHours.assembly / config.assembly.dailyManHours
        )
      } else if (d.stage === 'SHIP' && workHours.ship) {
        days = this.roundToHour(workHours.ship / config.ship.dailyManHours)
      }
      // Powder Coat remains fixed (vendor lead time)

      return { ...d, days: Math.max(0.25, days) }
    })
  }

  private filterForCurrentStage(
    currentStage: Stage,
    durations: { stage: Stage; days: number }[]
  ): { stage: Stage; days: number }[] {
    // CLOSED is terminal - no projection needed
    if (currentStage === 'CLOSED') {
      return []
    }

    // Already returned above if CLOSED, so only check QUEUE here
    const isInProduction = currentStage !== 'QUEUE'

    if (!isInProduction) {
      return durations
    }

    const currentIndex = PRODUCTION_STAGES.indexOf(
      currentStage as (typeof PRODUCTION_STAGES)[number]
    )
    if (currentIndex < 0) {
      return durations
    }

    return durations.filter((d) => {
      const stageIndex = PRODUCTION_STAGES.indexOf(
        d.stage as (typeof PRODUCTION_STAGES)[number]
      )
      return stageIndex >= currentIndex
    })
  }

  private buildTimeline(
    durations: { stage: Stage; days: number }[],
    timelineStart: Date
  ): StageProjection[] {
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    let cursor = timelineStart
    return durations.map((entry) => {
      const start = cursor
      const end = new Date(start.getTime() + entry.days * MS_PER_DAY)
      cursor = end

      return Object.freeze({
        stage: entry.stage,
        start,
        end,
        days: entry.days,
      })
    })
  }
}

// Export singleton for convenience
export const schedulingService = new SchedulingService()
