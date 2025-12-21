import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PumpDetailModal } from './PumpDetailModal'
import { useApp } from '../../store'
import { Pump } from '../../types'
import { DEFAULT_CAPACITY_CONFIG } from '../../lib/capacity'

// Mock the store
vi.mock('../../store', () => ({
  useApp: vi.fn(),
}))

describe('PumpDetailModal', () => {
  const mockUpdatePump = vi.fn()
  const mockPausePump = vi.fn()
  const mockResumePump = vi.fn()
  const mockGetModelLeadTimes = vi.fn().mockReturnValue({
    fabrication: 1.5,
    powder_coat: 2,
    assembly: 1,
    testing: 0.25,
  })

  const mockPump: Pump = {
    id: 'p1',
    serial: 1001,
    po: 'PO123',
    customer: 'Cust1',
    model: 'M1',
    stage: 'QUEUE',
    priority: 'Normal',
    value: 1000,
    last_update: new Date().toISOString(),
    // Extra fields simulated via casting in component, but here strict Pump type
  }

  beforeEach(() => {
    ;(useApp as unknown as Mock).mockReturnValue({
      updatePump: mockUpdatePump,
      pausePump: mockPausePump,
      resumePump: mockResumePump,
      getModelLeadTimes: mockGetModelLeadTimes,
      pumps: [],
      capacityConfig: DEFAULT_CAPACITY_CONFIG,
    })
  })

  it('should render pump details', () => {
    render(<PumpDetailModal pump={mockPump} onClose={() => {}} />)
    expect(screen.getByText('Pump Details')).toBeDefined()
    // Serial number may appear in multiple places (header + details)
    expect(screen.getAllByText('#1001').length).toBeGreaterThan(0)
  })
})
