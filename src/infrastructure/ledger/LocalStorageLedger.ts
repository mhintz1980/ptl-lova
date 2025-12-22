/**
 * LocalStorage-backed Stage Ledger implementation.
 *
 * Stores enriched stage transition records separate from the raw EventStore.
 */

import { nanoid } from 'nanoid'
import type { StageLedger, StageMoveRecord } from './StageLedger'

export const LEDGER_STORAGE_KEY = 'pumptracker-stage-ledger'

/**
 * Serialized record format (dates as ISO strings)
 */
interface SerializedRecord extends Omit<StageMoveRecord, 'movedAt'> {
  movedAt: string
}

class LocalStorageLedger implements StageLedger {
  async append(record: StageMoveRecord): Promise<void> {
    const records = await this.getAllRaw()
    const serialized: SerializedRecord = {
      ...record,
      movedAt: record.movedAt.toISOString(),
    }
    records.push(serialized)
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records))
  }

  async getByPump(pumpId: string): Promise<StageMoveRecord[]> {
    const all = await this.getAll()
    return all.filter((r) => r.pumpId === pumpId)
  }

  async getByDateRange(start: Date, end: Date): Promise<StageMoveRecord[]> {
    const all = await this.getAll()
    return all.filter((r) => r.movedAt >= start && r.movedAt <= end)
  }

  async getAll(): Promise<StageMoveRecord[]> {
    const raw = await this.getAllRaw()
    return raw.map((r) => ({
      ...r,
      movedAt: new Date(r.movedAt),
    }))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(LEDGER_STORAGE_KEY)
  }

  private async getAllRaw(): Promise<SerializedRecord[]> {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY)
    if (!raw) return []

    try {
      return JSON.parse(raw) as SerializedRecord[]
    } catch (error) {
      console.error('Failed to parse ledger from localStorage:', error)
      return []
    }
  }
}

/**
 * Helper to create a new StageMoveRecord with auto-generated ID
 */
export function createStageMoveRecord(
  props: Omit<StageMoveRecord, 'id'>
): StageMoveRecord {
  return {
    id: nanoid(),
    ...props,
  }
}

/**
 * Singleton ledger instance
 */
export const stageLedger: StageLedger = new LocalStorageLedger()
