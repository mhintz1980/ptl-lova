import { describe, expect, it, vi } from 'vitest'
import { parsePoCsv } from './poCsvImport'

vi.mock('./seed', () => ({
  getModelPrice: vi.fn(() => 10000),
  getModelBom: vi.fn(() => ({ engine: 'Honda GX390', gearbox: 'PA 2:1' })),
}))

describe('parsePoCsv', () => {
  it('parses a valid CSV into a single PO payload', () => {
    const csv = [
      'po,customer,date_received,promise_date,model,quantity,color,value_each,priority,engine,gearbox,notes',
      'PO-1,Acme,2026-01-22,2026-02-14,DD-6,2,Black,12500,Normal,Honda GX390,PA 2:1,Note',
      'PO-1,Acme,2026-01-22,2026-02-14,DD-4,1,Red,,High,,,',
    ].join('\n')

    const result = parsePoCsv(csv)

    expect(result.po).toBe('PO-1')
    expect(result.customer).toBe('Acme')
    expect(result.dateReceived).toBe('2026-01-22')
    expect(result.promiseDate).toBe('2026-02-14')
    expect(result.lines).toHaveLength(2)
    expect(result.lines[1].valueEach).toBe(10000)
    expect(result.lines[1].engine).toBe('Honda GX390')
  })

  it('fails when required columns are missing', () => {
    const csv = ['po,customer,quantity', 'PO-1,Acme,2'].join('\n')
    expect(() => parsePoCsv(csv)).toThrow(/model/i)
  })

  it('fails when multiple POs are present', () => {
    const csv = [
      'po,customer,model,quantity',
      'PO-1,Acme,DD-6,1',
      'PO-2,Acme,DD-6,1',
    ].join('\n')
    expect(() => parsePoCsv(csv)).toThrow(/single PO/i)
  })

  it('fails when quantity is invalid', () => {
    const csv = ['po,customer,model,quantity', 'PO-1,Acme,DD-6,0'].join('\n')
    expect(() => parsePoCsv(csv)).toThrow(/quantity/i)
  })
})
