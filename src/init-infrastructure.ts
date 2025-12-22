/**
 * Initialize infrastructure services.
 *
 * This module runs once at app startup to wire up domain event subscribers.
 */

import { getEventBus } from './infrastructure/eventBus/EventBus'
import { initLedgerSubscriber, stageLedger } from './infrastructure/ledger'

// Initialize the ledger subscriber to write stage moves to the ledger
initLedgerSubscriber(getEventBus(), stageLedger)

// Export for module side-effect import
export {}
