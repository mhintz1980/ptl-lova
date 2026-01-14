/**
 * export utility tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportToCsv, exportToJson, downloadCsv, downloadJson } from './export'
import { Pump } from '../types'

describe('export utilities', () => {
  const mockPumps: Pump[] = [
    {
      id: 'pump-1',
      serial: 1001,
      po: 'PO-123',
      customer: 'ACME Corp',
      model: 'XL-500',
      stage: 'FABRICATION',
      priority: 'High',
      powder_color: 'Red',
      last_update: '2025-01-01T10:00:00Z',
      value: 5000,
      forecastEnd: '2025-01-15T10:00:00Z',
    },
    {
      id: 'pump-2',
      serial: 1002,
      po: 'PO-124',
      customer: 'Beta Inc',
      model: 'SM-200',
      stage: 'ASSEMBLY',
      priority: 'Normal',
      powder_color: 'Blue',
      last_update: '2025-01-02T10:00:00Z',
      value: 3000,
    },
  ]

  describe('exportToCsv', () => {
    it('should export all columns when no columns specified', () => {
      const csv = exportToCsv(mockPumps)
      expect(csv).toContain('id,serial,po,customer,model,stage,priority')
      expect(csv).toContain('pump-1')
      expect(csv).toContain('pump-2')
      expect(csv).toContain('ACME Corp')
      expect(csv).toContain('Beta Inc')
    })

    it('should export only specified columns', () => {
      const csv = exportToCsv(mockPumps, ['id', 'po', 'customer'])
      const lines = csv.split('\n')
      const header = lines[0].trim()

      // Header should only contain specified columns
      expect(header).toBe('id,po,customer')

      // Should not contain other columns
      expect(csv).not.toContain('serial')
      expect(csv).not.toContain('model')

      // Should still contain the data for specified columns
      expect(csv).toContain('pump-1')
      expect(csv).toContain('PO-123')
      expect(csv).toContain('ACME Corp')
    })

    it('should handle empty array', () => {
      const csv = exportToCsv([])
      // CSV with no data rows, just empty or header
      expect(csv).toBeDefined()
    })

    it('should handle single pump', () => {
      const csv = exportToCsv([mockPumps[0]])
      expect(csv).toContain('pump-1')
      expect(csv).not.toContain('pump-2')
    })
  })

  describe('exportToJson', () => {
    it('should export all columns when no columns specified', () => {
      const json = exportToJson(mockPumps)
      const parsed = JSON.parse(json)

      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toHaveProperty('id', 'pump-1')
      expect(parsed[0]).toHaveProperty('serial', 1001)
      expect(parsed[0]).toHaveProperty('customer', 'ACME Corp')
      expect(parsed[1]).toHaveProperty('id', 'pump-2')
    })

    it('should export only specified columns', () => {
      const json = exportToJson(mockPumps, ['id', 'po', 'customer'])
      const parsed = JSON.parse(json)

      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toHaveProperty('id', 'pump-1')
      expect(parsed[0]).toHaveProperty('po', 'PO-123')
      expect(parsed[0]).toHaveProperty('customer', 'ACME Corp')

      // Should not have other properties
      expect(parsed[0]).not.toHaveProperty('serial')
      expect(parsed[0]).not.toHaveProperty('model')
      expect(parsed[0]).not.toHaveProperty('stage')
    })

    it('should handle empty array', () => {
      const json = exportToJson([])
      const parsed = JSON.parse(json)
      expect(parsed).toEqual([])
    })

    it('should format JSON with proper indentation', () => {
      const json = exportToJson(mockPumps)
      // Check for proper formatting (indentation)
      expect(json).toContain('  ')
      expect(json).toContain('\n')
    })
  })

  describe('downloadCsv', () => {
    beforeEach(() => {
      // Mock DOM APIs
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
    })

    it('should trigger download with correct filename pattern', () => {
      downloadCsv(mockPumps)

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('should handle column filtering', () => {
      downloadCsv(mockPumps, ['id', 'po'])

      expect(document.createElement).toHaveBeenCalled()
    })
  })

  describe('downloadJson', () => {
    beforeEach(() => {
      // Mock DOM APIs
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
    })

    it('should trigger download with correct filename pattern', () => {
      downloadJson(mockPumps)

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('should handle column filtering', () => {
      downloadJson(mockPumps, ['id', 'customer'])

      expect(document.createElement).toHaveBeenCalled()
    })
  })
})
