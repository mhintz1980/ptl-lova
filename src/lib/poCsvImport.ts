import Papa from 'papaparse'
import type { PoLine, Priority } from '../types'
import { getModelBom, getModelPrice } from './seed'

const REQUIRED_HEADERS = ['po', 'customer', 'model', 'quantity']
const PRIORITIES: Priority[] = ['Low', 'Normal', 'High', 'Rush', 'Urgent']

type ParsedPo = {
  po: string
  customer: string
  dateReceived?: string
  promiseDate?: string
  lines: PoLine[]
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[$,]/g, '').trim()
  if (!cleaned) return undefined
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : undefined
}

function assertValidDate(value?: string, label?: string) {
  if (!value) return
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label ?? 'date'} is invalid: ${value}`)
  }
}

export function parsePoCsv(csvText: string): ParsedPo {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeader,
  })

  if (parsed.errors.length) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`)
  }

  const rows = parsed.data.filter((row) => Object.values(row).some(Boolean))
  if (rows.length === 0) {
    throw new Error('CSV file contains no rows')
  }

  const headers = Object.keys(rows[0])
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`)
    }
  }

  const poSet = new Set(rows.map((row) => row.po?.trim()).filter(Boolean))
  const customerSet = new Set(
    rows.map((row) => row.customer?.trim()).filter(Boolean)
  )

  if (poSet.size !== 1 || customerSet.size !== 1) {
    throw new Error('CSV must contain a single PO and customer')
  }

  const po = [...poSet][0]
  const customer = [...customerSet][0]

  const dateReceivedValues = new Set(
    rows.map((row) => row.date_received?.trim()).filter(Boolean)
  )
  const promiseDateValues = new Set(
    rows.map((row) => row.promise_date?.trim()).filter(Boolean)
  )

  if (dateReceivedValues.size > 1) {
    throw new Error('date_received must be consistent across rows')
  }

  const dateReceived = [...dateReceivedValues][0]
  const promiseDate = promiseDateValues.size === 1
    ? [...promiseDateValues][0]
    : undefined

  assertValidDate(dateReceived, 'date_received')
  assertValidDate(promiseDate, 'promise_date')

  const lines: PoLine[] = rows.map((row) => {
    const model = row.model?.trim()
    if (!model) throw new Error('model is required for every row')

    const quantityRaw = row.quantity?.trim() ?? ''
    const quantity = Number(quantityRaw)
    if (
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(`quantity must be > 0 for model ${model}`)
    }

    const priorityRaw = row.priority?.trim()
    const priority = priorityRaw
      ? PRIORITIES.find((p) => p.toLowerCase() === priorityRaw.toLowerCase())
      : 'Normal'

    if (!priority) {
      throw new Error(`priority is invalid: ${row.priority}`)
    }

    const valueEach = parseNumber(row.value_each)
    const bom = getModelBom(model)

    const line: PoLine = {
      model,
      quantity,
      color: row.color?.trim() || '',
      promiseDate: row.promise_date?.trim() || '',
      valueEach: valueEach ?? getModelPrice(model) ?? 0,
      priority,
      engine: row.engine?.trim() || bom.engine || '',
      gearbox: row.gearbox?.trim() || bom.gearbox || '',
      notes: row.notes?.trim() || '',
    }

    assertValidDate(line.promiseDate, 'promise_date')
    return line
  })

  return { po, customer, dateReceived, promiseDate, lines }
}
