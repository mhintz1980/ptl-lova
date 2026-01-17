/**
 * Unit tests for dashboard KPI calculators
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Pump } from '../../types'
import {
  calculateKpi,
  calculateThroughput,
  getWorkloadByStage,
  getPumpsByCustomer,
  getCapacityByDept,
  getAverageStageAge,
  getWeeklyThroughput,
} from './kpiCalculators'

// --- Test Fixtures ---

const createPump = (overrides: Partial<Pump> = {}): Pump => ({
  id: `pump-${Math.random().toString(36).slice(2, 9)}`,
  po: 'PO-001',
  serial: 1001,
  customer: 'Test Customer',
  model: 'Test Model',
  stage: 'FABRICATION',
  priority: 'Normal',
  last_update: new Date().toISOString(),
  value: 5000,
  ...overrides,
})

describe('kpiCalculators', () => {
  describe('calculateKpi', () => {
    it('calculates activeWip - pumps not in QUEUE or CLOSED', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'QUEUE' }),
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'ASSEMBLY' }),
        createPump({ stage: 'CLOSED' }),
      ]

      const result = calculateKpi('activeWip', pumps)

      expect(result.value).toBe(2) // FABRICATION + ASSEMBLY
      expect(result.formatted).toBe('2')
      expect(result.subtitle).toBe('pumps in production')
    })

    it('calculates lateOrders - past promise date, not closed', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)

      const pumps: Pump[] = [
        createPump({
          stage: 'FABRICATION',
          promiseDate: pastDate.toISOString(),
        }),
        createPump({ stage: 'ASSEMBLY', promiseDate: pastDate.toISOString() }),
        createPump({ stage: 'SHIP', promiseDate: futureDate.toISOString() }),
        createPump({ stage: 'CLOSED', promiseDate: pastDate.toISOString() }),
      ]

      const result = calculateKpi('lateOrders', pumps)

      expect(result.value).toBe(2) // 2 late orders (not CLOSED)
      expect(result.health).toBe('negative')
    })

    it('calculates capacityUtil correctly', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'QUEUE' }),
        createPump({ stage: 'QUEUE' }),
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'ASSEMBLY' }),
      ]

      const result = calculateKpi('capacityUtil', pumps)

      // 2 active (FAB, ASSY) / 4 non-closed = 50%
      expect(result.value).toBe(50)
      expect(result.formatted).toBe('50%')
    })

    it('calculates totalValue - sum of non-closed pump values', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'FABRICATION', value: 10000 }),
        createPump({ stage: 'ASSEMBLY', value: 15000 }),
        createPump({ stage: 'CLOSED', value: 20000 }),
      ]

      const result = calculateKpi('totalValue', pumps)

      expect(result.value).toBe(25000) // 10k + 15k (excludes CLOSED)
    })

    it('calculates topCustomer correctly', () => {
      const pumps: Pump[] = [
        createPump({ customer: 'Acme Corp' }),
        createPump({ customer: 'Acme Corp' }),
        createPump({ customer: 'Acme Corp' }),
        createPump({ customer: 'Widget Inc' }),
        createPump({ customer: 'Widget Inc' }),
      ]

      const result = calculateKpi('topCustomer', pumps)

      expect(result.formatted).toBe('Acme Corp')
      expect(result.value).toBe(3)
      expect(result.subtitle).toBe('3 pumps')
    })

    it('returns default for unknown KPI id', () => {
      const result = calculateKpi('unknownKpi' as any, [])

      expect(result.value).toBe(0)
      expect(result.formatted).toBe('—')
    })
  })

  describe('calculateThroughput', () => {
    let realDate: DateConstructor

    beforeEach(() => {
      realDate = global.Date
      const mockNow = new Date('2026-01-17T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockNow)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('counts closed pumps in last 30 days', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10)

      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45)

      const pumps: Pump[] = [
        createPump({ stage: 'CLOSED', last_update: recentDate.toISOString() }),
        createPump({ stage: 'CLOSED', last_update: recentDate.toISOString() }),
        createPump({ stage: 'CLOSED', last_update: oldDate.toISOString() }),
        createPump({
          stage: 'FABRICATION',
          last_update: recentDate.toISOString(),
        }),
      ]

      const result = calculateThroughput(pumps)

      expect(result.value).toBe(2) // 2 closed in last 30 days
      expect(result.subtitle).toBe('completed this month')
    })
  })

  describe('getWorkloadByStage', () => {
    it('counts pumps by stage, excluding CLOSED', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'ASSEMBLY' }),
        createPump({ stage: 'CLOSED' }),
        createPump({ stage: 'CLOSED' }),
      ]

      const result = getWorkloadByStage(pumps)

      expect(result).toHaveLength(2) // FAB and ASSY
      expect(result.find((r) => r.id === 'FABRICATION')?.value).toBe(2)
      expect(result.find((r) => r.id === 'ASSEMBLY')?.value).toBe(1)
    })

    it('returns empty array for no active pumps', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'CLOSED' }),
        createPump({ stage: 'CLOSED' }),
      ]

      const result = getWorkloadByStage(pumps)

      expect(result).toHaveLength(0)
    })
  })

  describe('getPumpsByCustomer', () => {
    it('returns top 10 customers sorted by pump count', () => {
      const pumps: Pump[] = [
        createPump({ customer: 'Customer A', stage: 'FABRICATION' }),
        createPump({ customer: 'Customer A', stage: 'FABRICATION' }),
        createPump({ customer: 'Customer A', stage: 'FABRICATION' }),
        createPump({ customer: 'Customer B', stage: 'ASSEMBLY' }),
        createPump({ customer: 'Customer B', stage: 'ASSEMBLY' }),
        createPump({ customer: 'Customer C', stage: 'SHIP' }),
      ]

      const result = getPumpsByCustomer(pumps)

      expect(result[0]).toEqual({ name: 'Customer A', value: 3 })
      expect(result[1]).toEqual({ name: 'Customer B', value: 2 })
      expect(result[2]).toEqual({ name: 'Customer C', value: 1 })
    })

    it('excludes CLOSED pumps', () => {
      const pumps: Pump[] = [
        createPump({ customer: 'Active Customer', stage: 'FABRICATION' }),
        createPump({ customer: 'Closed Customer', stage: 'CLOSED' }),
      ]

      const result = getPumpsByCustomer(pumps)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Active Customer')
    })
  })

  describe('getCapacityByDept', () => {
    it('groups pumps into department buckets', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'FABRICATION' }),
        createPump({ stage: 'STAGED_FOR_POWDER' }),
        createPump({ stage: 'POWDER_COAT' }),
        createPump({ stage: 'ASSEMBLY' }),
        createPump({ stage: 'SHIP' }),
      ]

      const result = getCapacityByDept(pumps)

      const fab = result.find((r) => r.name === 'Fabrication')
      const powder = result.find((r) => r.name === 'Powder Coat')
      const assembly = result.find((r) => r.name === 'Assembly')
      const shipping = result.find((r) => r.name === 'Testing & Shipping')

      expect(fab?.value).toBe(2)
      expect(powder?.value).toBe(2) // STAGED_FOR_POWDER + POWDER_COAT
      expect(assembly?.value).toBe(1)
      expect(shipping?.value).toBe(1)
    })

    it('includes limit values for each department', () => {
      const result = getCapacityByDept([])

      expect(result.every((r) => typeof r.limit === 'number')).toBe(true)
    })
  })

  describe('getAverageStageAge', () => {
    it('calculates average age for active stages', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const pumps: Pump[] = [
        createPump({
          stage: 'FABRICATION',
          last_update: twoDaysAgo.toISOString(),
        }),
        createPump({
          stage: 'FABRICATION',
          last_update: twoDaysAgo.toISOString(),
        }),
      ]

      const result = getAverageStageAge(pumps)

      const fabData = result.find((r) => r.stage === 'FABRICATION')
      expect(fabData?.age).toBeGreaterThan(1.9)
      expect(fabData?.age).toBeLessThan(2.5)
    })

    it('returns canonical stage order', () => {
      const result = getAverageStageAge([])

      expect(result.map((r) => r.stage)).toEqual([
        'FABRICATION',
        'STAGED_FOR_POWDER',
        'POWDER_COAT',
        'ASSEMBLY',
        'SHIP',
      ])
    })

    it('excludes QUEUE and CLOSED stages', () => {
      const pumps: Pump[] = [
        createPump({ stage: 'QUEUE', last_update: new Date().toISOString() }),
        createPump({ stage: 'CLOSED', last_update: new Date().toISOString() }),
        createPump({
          stage: 'FABRICATION',
          last_update: new Date().toISOString(),
        }),
      ]

      const result = getAverageStageAge(pumps)

      // Should not include QUEUE or CLOSED
      expect(result.find((r) => r.stage === 'QUEUE')).toBeUndefined()
      expect(result.find((r) => r.stage === 'CLOSED')).toBeUndefined()
    })
  })

  describe('getWeeklyThroughput', () => {
    it('delegates to calculateThroughput', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5)

      const pumps: Pump[] = [
        createPump({ stage: 'CLOSED', last_update: recentDate.toISOString() }),
      ]

      const result = getWeeklyThroughput(pumps)

      expect(typeof result).toBe('number')
      expect(result).toBe(1)
    })
  })
})
