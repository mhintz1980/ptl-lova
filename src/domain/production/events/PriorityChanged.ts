/**
 * PriorityChanged Event - Emitted when a pump's priority level is modified.
 * Tracks priority changes for audit purposes and potential notifications.
 */
import type { DomainEvent } from './DomainEvent'
import type { Priority } from '../../../types'

export interface PriorityChanged extends DomainEvent {
  readonly eventType: 'PriorityChanged'
  readonly pumpId: string
  readonly oldPriority: Priority
  readonly newPriority: Priority
}

export function priorityChanged(
  pumpId: string,
  oldPriority: Priority,
  newPriority: Priority
): PriorityChanged {
  return {
    eventType: 'PriorityChanged',
    aggregateId: pumpId,
    occurredAt: new Date(),
    pumpId,
    oldPriority,
    newPriority,
  }
}
