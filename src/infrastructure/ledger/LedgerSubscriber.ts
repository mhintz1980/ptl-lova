/**
 * LedgerSubscriber - Listens for domain events and writes to the stage ledger.
 *
 * This creates enriched ledger records from PumpStageMoved events,
 * calculating daysInPreviousStage at write time.
 */

import type { EventBus } from '../eventBus/EventBus'
import type { PumpStageMoved } from '../../domain/production/events/PumpStageMoved'
import type { StageLedger } from './StageLedger'
import { createStageMoveRecord } from './LocalStorageLedger'
import { calculateDaysInPreviousStage } from '../../lib/calculateDaysInStage'

/**
 * Initialize the ledger subscriber on the EventBus.
 *
 * @param eventBus - The EventBus instance to subscribe to
 * @param ledger - The StageLedger to write records to
 * @returns Unsubscribe function
 */
export function initLedgerSubscriber(
  eventBus: EventBus,
  ledger: StageLedger
): () => void {
  return eventBus.subscribe<PumpStageMoved>('PumpStageMoved', async (event) => {
    const daysInPreviousStage = calculateDaysInPreviousStage(
      event.pumpId,
      event.fromStage,
      event.occurredAt
    )

    const record = createStageMoveRecord({
      pumpId: event.pumpId,
      serial: event.context?.serial ?? '',
      model: event.context?.model ?? 'Unknown',
      customer: event.context?.customer ?? 'Unknown',
      po: event.context?.po ?? 'Unknown',
      fromStage: event.fromStage,
      toStage: event.toStage,
      movedAt: event.occurredAt,
      daysInPreviousStage,
    })

    await ledger.append(record)
  })
}
