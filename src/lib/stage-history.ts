import type { PumpStageMoved } from '../domain/production/events/PumpStageMoved'
import type { Stage } from '../types'
import { EVENTS_STORAGE_KEY } from '../infrastructure/events/EventStore'

export type StagedForPowderHistory = {
  completed: boolean
  lastEnteredAt?: Date
  lastExitedAt?: Date
}

export function getPumpStageMoveEvents(pumpId: string): PumpStageMoved[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(EVENTS_STORAGE_KEY)
  if (!raw) return []

  try {
    const events = JSON.parse(raw) as Array<{
      aggregateId: string
      eventType: string
      occurredAt: string
    }>
    return events
      .filter(
        (e) => e.aggregateId === pumpId && e.eventType === 'PumpStageMoved'
      )
      .map((e: any) => ({
        ...e,
        occurredAt: new Date(e.occurredAt),
      }))
  } catch (error) {
    console.error('Failed to parse stage events from localStorage:', error)
    return []
  }
}

export function getStagedForPowderHistory(
  events: PumpStageMoved[]
): StagedForPowderHistory {
  let lastEnteredAt: Date | undefined
  let lastExitedAt: Date | undefined
  let completed = false

  events.forEach((event) => {
    if (event.toStage === 'STAGED_FOR_POWDER') {
      lastEnteredAt = event.occurredAt
    }
    if (event.fromStage === 'STAGED_FOR_POWDER') {
      lastExitedAt = event.occurredAt
      if (isBeyondStagedForPowder(event.toStage)) {
        completed = true
      }
    }
  })

  return { completed, lastEnteredAt, lastExitedAt }
}

function isBeyondStagedForPowder(stage: Stage): boolean {
  return ['POWDER_COAT', 'ASSEMBLY', 'SHIP', 'CLOSED'].includes(stage)
}
