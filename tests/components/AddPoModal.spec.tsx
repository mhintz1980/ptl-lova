import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AddPoModal } from '../../src/components/toolbar/AddPoModal'
import { useApp } from '../../src/store'

vi.mock('../../src/lib/poCsvImport', () => ({
  parsePoCsv: vi.fn(() => ({
    po: 'PO-1',
    customer: 'Acme',
    dateReceived: '2026-01-22',
    promiseDate: '2026-02-14',
    lines: [
      {
        model: 'DD-6',
        quantity: 2,
        color: 'Black',
        promiseDate: '2026-02-14',
        valueEach: 12500,
        priority: 'Normal',
        engine: 'Honda GX390',
        gearbox: 'PA 2:1',
        notes: '',
      },
    ],
  })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AddPoModal CSV import', () => {
  it('populates fields from a CSV file', async () => {
    useApp.setState((state) => ({
      ...state,
      pumps: [],
      addPO: vi.fn().mockResolvedValue(undefined),
    }))

    render(<AddPoModal isOpen onClose={vi.fn()} />)

    const fileInput = screen.getByTestId('po-csv-input') as HTMLInputElement
    const fileContents = 'po,customer,model,quantity\nPO-1,Acme,DD-6,2'
    const file = new File([fileContents], 'po.csv', {
      type: 'text/csv',
    })
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(fileContents),
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('PO-2024-...')).toHaveValue('PO-1')
    })

    expect(screen.getByPlaceholderText('Select...')).toHaveValue('Acme')
  })
})
