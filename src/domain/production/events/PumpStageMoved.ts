/**
 * PumpStageMoved Event - Emitted when a pump transitions between stages.
 */
import { DomainEvent } from './DomainEvent'
import { Stage } from '../value-objects/Stage'

export interface PumpStageMovedContext {
  readonly serial: number
  readonly model: string
  readonly customer: string
  readonly po: string
}

export interface PumpStageMoved extends DomainEvent {
  readonly eventType: 'PumpStageMoved'
  readonly pumpId: string
  readonly fromStage: Stage | null
  readonly toStage: Stage
  readonly context?: PumpStageMovedContext
}

export function pumpStageMoved(
  pumpId: string,
  fromStage: Stage | null,
  toStage: Stage,
  context?: PumpStageMovedContext
): PumpStageMoved {
  return {
    eventType: 'PumpStageMoved',
    aggregateId: pumpId,
    occurredAt: new Date(),
    pumpId,
    fromStage,
    toStage,
    context,
  }
}
