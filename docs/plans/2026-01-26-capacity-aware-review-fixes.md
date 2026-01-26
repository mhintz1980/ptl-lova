# Capacity-Aware Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply PR review fixes for capacity-aware scheduling, including holiday calculations, hook safety, and test hygiene.

**Architecture:** Update holiday logic to be computed per year with observed dates and cached lookups; ensure forecast and working-day calculations consult correct year sets; remove conditional hook usage and stabilize tests; replace third-party article content with an internal summary and provenance note.

**Tech Stack:** TypeScript, React, Vitest, date-fns

### Task 1: Remove third-party article content

**Files:**
- Modify: `skill-concept.txt`

**Step 1: Replace file contents with internal summary + provenance note**

Example content (2–4 sentences):

```text
This file summarizes the internal concept for skill design notes used during development.
It exists to capture brief rationale and intended usage in this repo only.
Any third-party content removed; no external copyrighted text remains.
If external references are needed, add links with explicit permission/license notes.
```

**Step 2: Verify file contains no third-party article text**

Run: `rg -n "Claude Skills Part 3|nathanonn|Textise" skill-concept.txt`
Expected: no matches

### Task 2: Stabilize UnifiedJobPill tests + hook order

**Files:**
- Modify: `src/components/scheduling/UnifiedJobPill.test.tsx`
- Modify: `src/components/scheduling/UnifiedJobPill.tsx`

**Step 1: Write failing test for hook-order safety + add timer cleanup**

Add to test file:

```tsx
import { afterEach } from 'vitest'

afterEach(() => {
  vi.useRealTimers()
})

it('rerenders cleanly when timeline appears', () => {
  const { rerender } = render(
    <UnifiedJobPill
      pump={basePump}
      timeline={[]}
      viewStart={new Date('2026-01-05T00:00:00.000Z')}
      totalDays={14}
      rowIndex={0}
    />
  )

  const timeline = [
    {
      stage: 'FABRICATION' as const,
      start: new Date('2026-01-05T00:00:00.000Z'),
      end: new Date('2026-01-07T00:00:00.000Z'),
      days: 2,
      pausedDays: 0,
      pump: basePump,
    },
  ]

  expect(() => {
    rerender(
      <UnifiedJobPill
        pump={basePump}
        timeline={timeline}
        viewStart={new Date('2026-01-05T00:00:00.000Z')}
        totalDays={14}
        rowIndex={0}
      />
    )
  }).not.toThrow()
})
```

**Step 2: Run test to verify failure**

Run: `pnpm test src/components/scheduling/UnifiedJobPill.test.tsx`
Expected: FAIL with hook order error (rendered more hooks than previous render)

**Step 3: Fix conditional hook usage**

Replace conditional `useMemo(() => new Date(), [])` with an inline `const now = Date.now()` (or `new Date()`), and ensure comparisons use the correct type.

**Step 4: Run test to verify pass**

Run: `pnpm test src/components/scheduling/UnifiedJobPill.test.tsx`
Expected: PASS

### Task 3: Compute federal holidays dynamically + observed days

**Files:**
- Modify: `src/lib/work-calendar.test.ts`
- Modify: `src/lib/work-calendar.ts`

**Step 1: Write failing tests for observed + computed holidays**

Add assertions (examples):

```ts
const holidays2026 = buildUsFederalHolidays(2026)
const holidays2027 = buildUsFederalHolidays(2027)

expect(holidays2026.has('2026-07-03')).toBe(true) // observed for 7/4 Saturday
expect(holidays2026.has('2026-01-19')).toBe(true) // MLK Day (3rd Mon Jan)
expect(holidays2027.has('2027-11-25')).toBe(true) // Thanksgiving 4th Thu Nov
```

**Step 2: Run test to verify failure**

Run: `pnpm test src/lib/work-calendar.test.ts`
Expected: FAIL (missing observed/derived dates)

**Step 3: Implement computed holiday logic**

- Add helpers for nth weekday and last weekday of month
- Apply weekend observation for fixed-date holidays
- Normalize dates via `normalizeUtcDay` and `toIsoDay`
- Return a `Set<string>` of ISO day strings

**Step 4: Run test to verify pass**

Run: `pnpm test src/lib/work-calendar.test.ts`
Expected: PASS

### Task 4: Count working days across year ranges

**Files:**
- Create: `src/lib/working-days.test.ts`
- Modify: `src/lib/working-days.ts`

**Step 1: Write failing test for cross-year holiday handling**

```ts
import { describe, it, expect } from 'vitest'
import { countWorkingDays } from './working-days'

describe('working-days', () => {
  it('counts across year boundaries with holidays', () => {
    const start = new Date('2026-12-30')
    const end = new Date('2027-01-05')
    expect(countWorkingDays(start, end)).toBe(3)
  })
})
```

**Step 2: Run test to verify failure**

Run: `pnpm test src/lib/working-days.test.ts`
Expected: FAIL (missing next-year holiday)

**Step 3: Implement year-range holiday aggregation**

- Build a set by iterating from `start.getFullYear()` to `end.getFullYear()`
- Merge holiday sets, dedupe via Set
- Call `countDays(start, end, holidays)`

**Step 4: Run test to verify pass**

Run: `pnpm test src/lib/working-days.test.ts`
Expected: PASS

### Task 5: Capacity forecast per-year holiday cache

**Files:**
- Modify: `src/lib/capacity-forecast.test.ts`
- Modify: `src/lib/capacity-forecast.ts`

**Step 1: Write failing test for next-year holiday skip**

Add to capacity forecast test:

```ts
it('skips next-year holidays when projecting across year boundary', () => {
  const pumps: Pump[] = [
    {
      id: 'p-cross-year',
      model: 'M1',
      stage: 'FABRICATION',
      priority: 'Normal',
      forecastStart: '2026-12-30',
    } as Pump,
  ]

  const result = buildCapacityForecast({
    pumps,
    capacityConfig,
    startDate: new Date('2026-12-30'),
    leadTimeLookup,
    workHoursLookup: () => ({
      fabrication: 32,
      assembly: 0,
      ship: 0,
    }),
  })

  const end = result.timelines['p-cross-year'][0].end.toISOString().slice(0, 10)
  expect(end).toBe('2027-01-04')
})
```

**Step 2: Run test to verify failure**

Run: `pnpm test src/lib/capacity-forecast.test.ts`
Expected: FAIL (end date resolves to 2027-01-01)

**Step 3: Implement per-year holiday cache and lookups**

- Add `Map<number, HolidaySet>` cache
- Add helper to fetch year set lazily
- Update `ensureWorkingDay`, `nextWorkingDay`, loop checks to use per-date holiday lookups
- For range calculations (staged buffer), combine holiday sets for relevant years

**Step 4: Run test to verify pass**

Run: `pnpm test src/lib/capacity-forecast.test.ts`
Expected: PASS

### Task 6: Full verification

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS

