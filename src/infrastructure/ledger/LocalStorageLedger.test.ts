/**
 * LocalStorageLedger tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  stageLedger,
  createStageMoveRecord,
  LEDGER_STORAGE_KEY,
} from './LocalStorageLedger'
import type { StageMoveRecord } from './StageLedger'

describe('LocalStorageLedger', () => {
  beforeEach(() => {
    localStorage.removeItem(LEDGER_STORAGE_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(LEDGER_STORAGE_KEY)
  })

  describe('createStageMoveRecord', () => {
    it('should create a record with auto-generated ID', () => {
      const record = createStageMoveRecord({
        pumpId: 'pump-1',
        serial: 1001,
        model: 'DD-4S',
        customer: 'Acme Corp',
        po: 'PO-001',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        movedAt: new Date('2025-01-01T10:00:00Z'),
        daysInPreviousStage: null,
      })

      expect(record.id).toBeDefined()
      expect(record.id.length).toBeGreaterThan(0)
      expect(record.pumpId).toBe('pump-1')
      expect(record.serial).toBe(1001)
      expect(record.model).toBe('DD-4S')
    })
  })

  describe('append', () => {
    it('should persist a record to localStorage', async () => {
      const record = createStageMoveRecord({
        pumpId: 'pump-1',
        serial: 1001,
        model: 'DD-4S',
        customer: 'Acme Corp',
        po: 'PO-001',
        fromStage: null,
        toStage: 'QUEUE',
        movedAt: new Date('2025-01-01T10:00:00Z'),
        daysInPreviousStage: null,
      })

      await stageLedger.append(record)

      const records = await stageLedger.getAll()
      expect(records).toHaveLength(1)
      expect(records[0].pumpId).toBe('pump-1')
    })
  })

  describe('getByPump', () => {
    it('should filter records by pumpId', async () => {
      const record1 = createStageMoveRecord({
        pumpId: 'pump-1',
        serial: 1001,
        model: 'DD-4S',
        customer: 'Acme',
        po: 'PO-001',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        movedAt: new Date(),
        daysInPreviousStage: 2.5,
      })

      const record2 = createStageMoveRecord({
        pumpId: 'pump-2',
        serial: 1002,
        model: 'DD-6',
        customer: 'Acme',
        po: 'PO-002',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        movedAt: new Date(),
        daysInPreviousStage: 1.0,
      })

      await stageLedger.append(record1)
      await stageLedger.append(record2)

      const pump1Records = await stageLedger.getByPump('pump-1')
      expect(pump1Records).toHaveLength(1)
      expect(pump1Records[0].serial).toBe(1001)
    })
  })

  describe('getByDateRange', () => {
    it('should filter records by date range', async () => {
      const jan1 = new Date('2025-01-01T10:00:00Z')
      const jan5 = new Date('2025-01-05T10:00:00Z')
      const jan10 = new Date('2025-01-10T10:00:00Z')

      await stageLedger.append(
        createStageMoveRecord({
          pumpId: 'pump-1',
          serial: 1001,
          model: 'DD-4S',
          customer: 'Acme',
          po: 'PO-001',
          fromStage: null,
          toStage: 'QUEUE',
          movedAt: jan1,
          daysInPreviousStage: null,
        })
      )

      await stageLedger.append(
        createStageMoveRecord({
          pumpId: 'pump-2',
          serial: 1002,
          model: 'DD-6',
          customer: 'Acme',
          po: 'PO-002',
          fromStage: null,
          toStage: 'QUEUE',
          movedAt: jan10,
          daysInPreviousStage: null,
        })
      )

      const rangeRecords = await stageLedger.getByDateRange(jan1, jan5)
      expect(rangeRecords).toHaveLength(1)
      expect(rangeRecords[0].serial).toBe(1001)
    })
  })

  describe('Date serialization', () => {
    it('should reconstruct Date objects from localStorage', async () => {
      const originalDate = new Date('2025-01-15T12:30:00Z')
      const record = createStageMoveRecord({
        pumpId: 'pump-1',
        serial: 1001,
        model: 'DD-4S',
        customer: 'Acme',
        po: 'PO-001',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
        movedAt: originalDate,
        daysInPreviousStage: 3.5,
      })

      await stageLedger.append(record)

      const records = await stageLedger.getAll()
      expect(records[0].movedAt).toBeInstanceOf(Date)
      expect(records[0].movedAt.getTime()).toBe(originalDate.getTime())
    })
  })

  describe('clear', () => {
    it('should remove all records', async () => {
      await stageLedger.append(
        createStageMoveRecord({
          pumpId: 'pump-1',
          serial: 1001,
          model: 'DD-4S',
          customer: 'Acme',
          po: 'PO-001',
          fromStage: null,
          toStage: 'QUEUE',
          movedAt: new Date(),
          daysInPreviousStage: null,
        })
      )

      await stageLedger.clear()

      const records = await stageLedger.getAll()
      expect(records).toHaveLength(0)
    })
  })
})
