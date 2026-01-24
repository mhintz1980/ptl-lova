# CSV Import for Add PO Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a CSV import button + drag-and-drop zone to the Add PO modal that validates a CSV file and populates the PO fields/line items without auto-submitting.

**Architecture:** Create a small CSV parsing/validation helper that returns a normalized Add PO payload. The Add PO modal reads a local CSV file, validates it with the helper, then overwrites the modal state (PO fields + lines). Use existing PapaParse dependency for CSV parsing and Sonner toasts for feedback.

**Tech Stack:** React + TypeScript, PapaParse, sonner, Vitest, @testing-library/react.

## CSV Format (v1)

**Single PO per file.** One row per line item. Required columns:

- `po`
- `customer`
- `model`
- `quantity`

Optional columns:

- `date_received`
- `promise_date`
- `color`
- `value_each`
- `priority` (Low | Normal | High | Rush | Urgent)
- `engine`
- `gearbox`
- `notes`

**Rules:**
- All rows must share the same `po` and `customer`.
- `quantity` must be an integer > 0.
- `value_each` must be a number (optional).
- Date fields must be parseable by `Date.parse` when provided.
- If `value_each` or `engine/gearbox` are missing, auto-fill using catalog defaults.

**Example:**
```csv
po,customer,date_received,promise_date,model,quantity,color,value_each,priority,engine,gearbox,notes
PO-2026-0042,Acme Rentals,2026-01-22,2026-02-14,DD-6,2,Black,12500,Normal,Honda GX390,PA 2:1,Rush for demo
PO-2026-0042,Acme Rentals,2026-01-22,2026-02-14,DD-4,1,Red,9800,High,,,
```

---

### Task 1: CSV parser + validation helper

**Files:**
- Create: `src/lib/poCsvImport.ts`
- Test: `src/lib/poCsvImport.test.ts`

**Step 1: Write the failing tests**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --run src/lib/poCsvImport.test.ts`
Expected: FAIL with "Cannot find module './poCsvImport'" or failing expectations.

**Step 3: Write minimal implementation**

```ts
// src/lib/poCsvImport.ts
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
  const promiseDate = promiseDateValues.size === 1 ? [...promiseDateValues][0] : undefined

  assertValidDate(dateReceived, 'date_received')
  assertValidDate(promiseDate, 'promise_date')

  const lines: PoLine[] = rows.map((row) => {
    const model = row.model?.trim()
    if (!model) throw new Error('model is required for every row')

    const quantity = Number.parseInt(row.quantity ?? '', 10)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`quantity must be > 0 for model ${model}`)
    }

    const priorityRaw = row.priority?.trim()
    const priority = (priorityRaw
      ? PRIORITIES.find((p) => p.toLowerCase() === priorityRaw.toLowerCase())
      : 'Normal') as Priority

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
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --run src/lib/poCsvImport.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/poCsvImport.ts src/lib/poCsvImport.test.ts
git commit -m "feat: add PO CSV import parser"
```

---

### Task 2: Add CSV import UI to AddPoModal

**Files:**
- Modify: `src/components/toolbar/AddPoModal.tsx`

**Step 1: Write the failing component test**

Create `tests/components/AddPoModal.spec.tsx`:

```tsx
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

const resetStore = () => {
  useApp.setState({
    pumps: [],
    addPO: vi.fn().mockResolvedValue(undefined),
  } as never)
}

describe('AddPoModal CSV import', () => {
  it('populates fields from a CSV file', async () => {
    resetStore()
    render(<AddPoModal isOpen onClose={vi.fn()} />)

    const fileInput = screen.getByTestId('po-csv-input') as HTMLInputElement
    const file = new File(['po,customer,model,quantity\nPO-1,Acme,DD-6,2'], 'po.csv', {
      type: 'text/csv',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('PO-2024-...')).toHaveValue('PO-1')
    })
    expect(screen.getByPlaceholderText('Select...')).toHaveValue('Acme')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --run tests/components/AddPoModal.spec.tsx`
Expected: FAIL (missing data-testid / import logic).

**Step 3: Implement AddPoModal import UI + wiring**

Add to `AddPoModal.tsx`:

- Imports:

```ts
import { UploadCloud } from 'lucide-react'
import { parsePoCsv } from '../../lib/poCsvImport'
```

- State + refs:

```ts
const fileInputRef = useRef<HTMLInputElement>(null)
const [isDragging, setIsDragging] = useState(false)
```

- Helpers:

```ts
const isFormDirty = useMemo(() => {
  const hasLineData = lines.some((line) =>
    [line.model, line.color, line.promiseDate, line.valueEach, line.notes].some(Boolean)
  )
  return Boolean(po || customer || dateReceived || promiseDate || hasLineData || lines.length > 1)
}, [po, customer, dateReceived, promiseDate, lines])

const applyImport = (payload: ReturnType<typeof parsePoCsv>) => {
  setPo(payload.po)
  setCustomer(payload.customer)
  setDateReceived(payload.dateReceived ?? '')
  setPromiseDate(payload.promiseDate ?? '')
  setLines(payload.lines)
  setActiveLineIndex(null)
  setActiveTab('details')
}

const handleCsvFile = async (file: File) => {
  if (isFormDirty) {
    const confirmed = confirm('Importing will overwrite the current form. Continue?')
    if (!confirmed) return
  }

  try {
    const text = await file.text()
    const payload = parsePoCsv(text)
    applyImport(payload)
    toast.success(`Imported ${payload.lines.length} line items from ${file.name}`)
  } catch (error) {
    logErrorReport(error, {
      where: 'AddPoModal.handleCsvFile',
      what: 'Failed to import PO CSV',
      request: {
        route: 'AddPoModal',
        operation: 'import csv',
        inputSummary: `file=${file.name}`,
      },
    })
    toast.error(error instanceof Error ? error.message : 'Invalid CSV file')
  } finally {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
}
```

- Add button + hidden input near header actions:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept=".csv,text/csv"
  className="hidden"
  data-testid="po-csv-input"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) handleCsvFile(file)
  }}
/>

<Button
  type="button"
  variant="outline"
  className="rounded-full border-border/50 bg-white/5 hover:bg-white/10"
  onClick={() => fileInputRef.current?.click()}
>
  <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
</Button>
```

- Add drop zone below PO fields (above table) with drag handlers:

```tsx
<div
  className={cn(
    'mx-6 mb-3 rounded-xl border border-dashed px-4 py-2 text-xs text-muted-foreground transition-colors',
    isDragging ? 'border-primary/70 bg-primary/5 text-primary' : 'border-border/60'
  )}
  onDragOver={(e) => {
    e.preventDefault()
    setIsDragging(true)
  }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={(e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleCsvFile(file)
  }}
>
  Drag and drop a CSV here, or click “Import CSV” to select a file.
</div>
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --run tests/components/AddPoModal.spec.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/toolbar/AddPoModal.tsx tests/components/AddPoModal.spec.tsx
git commit -m "feat: add CSV import to Add PO modal"
```

---

### Task 3: Regression coverage (optional but recommended)

**Files:**
- Test: `src/lib/poCsvImport.test.ts` (add date validation + priority edge cases)

**Step 1: Extend tests**

```ts
it('fails on invalid date format', () => {
  const csv = [
    'po,customer,model,quantity,promise_date',
    'PO-1,Acme,DD-6,1,not-a-date',
  ].join('\n')
  expect(() => parsePoCsv(csv)).toThrow(/promise_date/i)
})

it('fails on invalid priority', () => {
  const csv = [
    'po,customer,model,quantity,priority',
    'PO-1,Acme,DD-6,1,SuperRush',
  ].join('\n')
  expect(() => parsePoCsv(csv)).toThrow(/priority/i)
})
```

**Step 2: Run test to verify it fails then passes**

Run: `pnpm test --run src/lib/poCsvImport.test.ts`
Expected: FAIL then PASS.

**Step 3: Commit**

```bash
git add src/lib/poCsvImport.test.ts
git commit -m "test: cover CSV import edge cases"
```

---

## Verification

- Unit: `pnpm test --run src/lib/poCsvImport.test.ts`
- Component: `pnpm test --run tests/components/AddPoModal.spec.tsx`

## Notes

- Use @superpowers:test-driven-development when implementing.
- Keep import strictly "populate only" (no auto-save). All validation should happen before mutating modal state.
- If the CSV includes multiple `promise_date` values, set line-level `promiseDate` and leave PO-level `promiseDate` blank.

