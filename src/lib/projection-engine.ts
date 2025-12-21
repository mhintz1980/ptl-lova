/**
 * Projection Engine - Constitution §7 Compliant
 *
 * This module provides the canonical entrypoints for all projection logic.
 * Calendar = projection-only rendering. All functions here are PURE:
 * - No hidden state
 * - No mutation
 * - No caching side-effects
 *
 * Truth (pump + stage history) + Settings (capacityConfig) => Projection segments
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   projectPumpTimeline,
 *   projectCalendarEvents,
 *   type StageBlock,
 *   type CalendarStageEvent,
 * } from '../lib/projection-engine'
 * ```
 *
 * ## Architecture Note
 *
 * This facade delegates to existing implementations in:
 * - schedule.ts (buildStageTimeline, buildCalendarEvents)
 * - schedule-helper.ts (buildCapacityAwareTimelines)
 *
 * Full consolidation into a single module is deferred to a dedicated cleanup PR.
 * See: docs/status/current-work.md
 */

import type { Pump, CapacityConfig } from '../types'
import {
  buildStageTimeline,
  buildCalendarEvents,
  isValidScheduleDate,
  type StageBlock,
  type StageDurations,
  type CalendarStageEvent,
  type BuildCalendarEventsOptions,
} from './schedule'
import { buildCapacityAwareTimelines } from './schedule-helper'
import {
  getPumpStageMoveEvents,
  getStagedForPowderHistory,
  type StagedForPowderHistory,
} from './stage-history'

// =============================================================================
// Type Exports (for consumers)
// =============================================================================

export type {
  StageBlock,
  StageDurations,
  CalendarStageEvent,
  BuildCalendarEventsOptions,
  StagedForPowderHistory,
}

// =============================================================================
// Utility Exports
// =============================================================================

export { isValidScheduleDate }

// =============================================================================
// Canonical Entry Functions
// =============================================================================

/**
 * Project a pump's timeline into stage blocks.
 *
 * Constitution §7: This is a pure projection. It does NOT mutate the pump.
 *
 * @param pump - The pump to project (truth source)
 * @param leadTimes - Stage durations from product catalog
 * @param options - Optional configuration
 * @param options.startDate - Override start date (defaults to pump.forecastStart or today)
 * @param options.capacityConfig - Capacity settings for work-hour calculations
 * @param options.stageHistory - Pre-fetched stage history (if not provided, fetches from EventStore)
 * @returns Array of stage blocks representing the projected timeline
 */
export function projectPumpTimeline(
  pump: Pump,
  leadTimes: StageDurations,
  options?: {
    startDate?: Date
    capacityConfig?: CapacityConfig
    stageHistory?: StagedForPowderHistory
  }
): StageBlock[] {
  // If stageHistory not provided, fetch it (allows caller to optimize batch fetches)
  const stageHistory =
    options?.stageHistory ??
    getStagedForPowderHistory(getPumpStageMoveEvents(pump.id))

  return buildStageTimeline(pump, leadTimes, {
    startDate: options?.startDate,
    capacityConfig: options?.capacityConfig,
    stageHistory,
  })
}

/**
 * Project calendar events for multiple pumps.
 *
 * Constitution §7: Pure projection for calendar rendering.
 *
 * @param options - Configuration for event generation
 * @param options.pumps - Array of pumps to project
 * @param options.viewStart - Start date of the calendar view
 * @param options.days - Number of days in the calendar view
 * @param options.leadTimeLookup - Function to get lead times for a model
 * @param options.capacityConfig - Optional capacity settings
 * @returns Array of calendar stage events for rendering
 */
export function projectCalendarEvents(
  options: BuildCalendarEventsOptions
): CalendarStageEvent[] {
  return buildCalendarEvents(options)
}

/**
 * Build capacity-aware timelines for multiple pumps with vendor weekly limits.
 *
 * Constitution §5.3: Respects powder coat vendor weekly capacity.
 *
 * @param pumps - Array of pumps to project
 * @param capacityConfig - Capacity configuration including vendor limits
 * @param leadTimeLookup - Function to get lead times for a model
 * @returns Map of pump ID to stage blocks
 */
export function projectCapacityAwareTimelines(
  pumps: Pump[],
  capacityConfig: CapacityConfig,
  leadTimeLookup: (model: string) => StageDurations | undefined
): Record<string, StageBlock[]> {
  return buildCapacityAwareTimelines(pumps, capacityConfig, leadTimeLookup)
}
