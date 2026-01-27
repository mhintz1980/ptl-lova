import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KanbanPrintView } from './KanbanPrintView'
import { useApp } from '../../store'
import { Pump } from '../../types'

// Mock the store
vi.mock('../../store', () => {
  const useAppMock = vi.fn()
  // Mock getState which is accessed imperatively in PumpCard
  const getStateMock = vi.fn(() => ({
    getModelLeadTimes: vi.fn(),
  }))
  ;(useAppMock as unknown as { getState: typeof getStateMock }).getState =
    getStateMock
  return { useApp: useAppMock }
})

describe('KanbanPrintView', () => {
  const mockPumps: Pump[] = [
    {
      id: '1',
      model: 'Pump A',
      serial: 123,
      customer: 'Cust A',
      po: 'PO-100',
      priority: 'Urgent',
      stage: 'FABRICATION',
      value: 1000,
      last_update: new Date().toISOString(),
    },
    {
      id: '2',
      model: 'Pump B',
      serial: 456,
      customer: 'Cust B',
      po: 'PO-101',
      priority: 'Normal',
      stage: 'ASSEMBLY',
      value: 2000,
      last_update: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
  ]

  const defaultMockState = {
    pumps: mockPumps,
    filters: {},
    sortField: 'default',
    sortDirection: 'desc',
    collapsedStages: {},
    wipLimits: {},
    collapsedCards: false,
    isPumpLocked: vi.fn().mockReturnValue(false),
    getModelLeadTimes: vi.fn(),
    capacityConfig: { powderCoat: { vendors: [] } },
    isSandbox: false,
    originalSnapshot: null,
  }

  it('renders all three print pages', () => {
    const loadMock = vi.fn()
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultMockState,
      load: loadMock,
    })

    render(<KanbanPrintView />)
    expect(loadMock).toHaveBeenCalled()

    // Page 1: Daily Floor Sheet
    expect(screen.getByText('Daily Floor Sheet')).toBeInTheDocument()
    // Check for Kanban columns
    expect(screen.getAllByText('FABRICATION')).toHaveLength(1)
    expect(screen.getAllByText('Pump A')).toHaveLength(1) // Pump in Fab

    // Page 2: Weekly Production Schedule
    expect(screen.getByText('Weekly Production Schedule')).toBeInTheDocument()
    expect(screen.getByText('Fabrication Targets')).toBeInTheDocument()

    // Page 3: Critical Inventory Lookahead
    expect(screen.getByText('Critical Inventory Lookahead')).toBeInTheDocument()
    expect(screen.getByText('Cat C15 Oil Filters')).toBeInTheDocument()
  })
})
