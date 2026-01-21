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
  ;(useAppMock as any).getState = getStateMock
  return { useApp: useAppMock }
})

describe('KanbanPrintView', () => {
  const mockPumps: Pump[] = [
    {
      id: '1',
      model: 'Pump A',
      serial: '123',
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
      serial: '456',
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

  it('renders the print header correctly', () => {
    const loadMock = vi.fn()
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultMockState,
      load: loadMock,
    })

    render(<KanbanPrintView />)
    expect(loadMock).toHaveBeenCalled()

    expect(screen.getByText('Production Status')).toBeInTheDocument()

    // Check Total WIP metric (Label + Value in parent)
    const totalWipLabel = screen.getByText('Total WIP')
    expect(totalWipLabel.parentElement).toHaveTextContent('2')

    // Check Urgent metric (Label + Value in parent)
    // "Urgent" string appears in label. The value is '1'.
    const urgentLabel = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'div' && content === 'Urgent'
    })
    expect(urgentLabel.parentElement).toHaveTextContent('1')
  })

  it('renders stages and pumps', () => {
    const loadMock = vi.fn()
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultMockState,
      load: loadMock,
    })

    render(<KanbanPrintView />)
    // We expect 2 of each stage (one in visual board, one in report)
    expect(screen.getAllByText('FABRICATION')).toHaveLength(2)
    expect(screen.getAllByText('ASSEMBLY')).toHaveLength(2)

    // Pumps appear in both views
    expect(screen.getAllByText('Pump A')).toHaveLength(2)
    expect(screen.getAllByText('Pump B')).toHaveLength(2)
  })

  it('highlights stale pumps', () => {
    const loadMock = vi.fn()
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultMockState,
      load: loadMock,
    })

    render(<KanbanPrintView />)
    const staleDays = screen.getByText('5d')
    expect(staleDays).toHaveClass('text-red-600')
    expect(staleDays).toHaveClass('font-bold')
  })
})
