/**
 * Calculate days spent in the previous stage for a pump.
 *
 * Uses the EventStore to find when the pump entered the fromStage,
 * then calculates the elapsed time.
 */

import type { Stage } from '../types'
import { getPumpStageMoveEvents } from './stage-history'

/**
 * Calculate days spent in the previous stage.
 *
 * @param pumpId - The pump aggregate ID
 * @param fromStage - The stage being exited (null for first move)
 * @param movedAt - When the transition occurred
 * @returns Days in previous stage, or null if first move or no entry event found
 */
export function calculateDaysInPreviousStage(
  pumpId: string,
  fromStage: Stage | null,
  movedAt: Date
): number | null {
  // First move has no previous stage
  if (!fromStage) return null

  const events = getPumpStageMoveEvents(pumpId)

  // Find the most recent event where pump entered the fromStage
  const entryEvent = events
    .filter((e) => e.toStage === fromStage)
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0]

  if (!entryEvent) {
    // No record of entering this stage - could be initial state
    return null
  }

  const msInStage = movedAt.getTime() - entryEvent.occurredAt.getTime()
  const daysInStage = msInStage / (1000 * 60 * 60 * 24)

  // Return with 2 decimal precision
  return Math.round(daysInStage * 100) / 100
}
