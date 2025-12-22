/**
 * Stage Ledger - Persists enriched stage transition records for analytics.
 *
 * This is DERIVED data from PumpStageMoved events, optimized for querying.
 * The raw events in EventStore remain the source of truth.
 */

import type { Stage } from '../../types'

/**
 * A single stage transition record with enriched context.
 */
export interface StageMoveRecord {
  /** Unique record identifier */
  readonly id: string
  /** Pump aggregate ID */
  readonly pumpId: string
  /** Pump serial number */
  readonly serial: number
  /** Pump model code */
  readonly model: string
  /** Customer name */
  readonly customer: string
  /** Purchase order number */
  readonly po: string
  /** Previous stage (null for first move) */
  readonly fromStage: Stage | null
  /** New stage */
  readonly toStage: Stage
  /** Timestamp of transition */
  readonly movedAt: Date
  /** Days spent in previous stage (null for first move) */
  readonly daysInPreviousStage: number | null
}

/**
 * Stage Ledger interface for persisting and querying stage transitions.
 */
export interface StageLedger {
  /** Append a new stage move record */
  append(record: StageMoveRecord): Promise<void>

  /** Get all records for a specific pump */
  getByPump(pumpId: string): Promise<StageMoveRecord[]>

  /** Get records within a date range */
  getByDateRange(start: Date, end: Date): Promise<StageMoveRecord[]>

  /** Get all records */
  getAll(): Promise<StageMoveRecord[]>

  /** Clear all records (for testing) */
  clear(): Promise<void>
}
