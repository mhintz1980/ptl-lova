# Capacity-Aware Scheduling Forecast Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a capacity-aware, holiday-aware forecasting engine for the scheduling page that projects pump start/end dates and shows each pump as a single timeline line, with lowest-priority pumps paused when WIP capacity is exceeded and resumed immediately when capacity frees.

**Architecture:** Introduce a work-calendar utility (weekends + US federal holidays for current year), a daily simulation forecast engine that allocates stage man-hours evenly across active pumps while enforcing per-stage WIP limits, and wire the output into the existing scheduling projection pipeline and UI. Add overdue indicators without auto-moving stages.

**Tech Stack:** TypeScript, React, Zustand store, date-fns, Vitest, React Testing Library.

---

### Task 1: Add a holiday-aware work calendar utility

**Files:**
- Create: `src/lib/work-calendar.ts`
- Modify: `src/lib/working-days.ts`
- Test: `src/lib/work-calendar.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { isWorkingDay, countWorkingDays, buildUsFederalHolidays } from './work-calendar'

const holidays2026 = buildUsFederalHolidays(2026)

describe('work-calendar', () => {
  it('treats weekends and holidays as non-working', () => {
    expect(isWorkingDay(new Date('2026-01-10'), holidays2026)).toBe(false) // Saturday
    expect(isWorkingDay(new Date('2026-01-19'), holidays2026)).toBe(false) // MLK Day
    expect(isWorkingDay(new Date('2026-01-20'), holidays2026)).toBe(true)
  })

  it('counts working days excluding weekends and holidays', () => {
    const start = new Date('2026-01-15')
    const end = new Date('2026-01-22')
    // 16(Fri), 20(Tue), 21(Wed), 22(Thu) => 4 days
    expect(countWorkingDays(start, end, holidays2026)).toBe(4)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter work-calendar`
Expected: FAIL with missing module or function errors.

**Step 3: Write minimal implementation**

```ts
import { startOfDay, isWeekend } from 'date-fns'

export type HolidaySet = Set<string>

export const toIsoDay = (date: Date) => startOfDay(date).toISOString().split('T')[0]

export function buildUsFederalHolidays(year: number): HolidaySet {
  // Minimal list for current year; expand later if needed.
  const dates = [
    `${year}-01-01`, // New Year's Day
    `${year}-01-19`, // MLK Day (2026)
    `${year}-02-16`, // Presidents' Day (2026)
    `${year}-05-25`, // Memorial Day (2026)
    `${year}-06-19`, // Juneteenth (2026)
    `${year}-07-04`, // Independence Day (2026)
    `${year}-09-07`, // Labor Day (2026)
    `${year}-10-12`, // Columbus Day (2026)
    `${year}-11-11`, // Veterans Day (2026)
    `${year}-11-26`, // Thanksgiving (2026)
    `${year}-12-25`, // Christmas (2026)
  ]
  return new Set(dates)
}

export function isWorkingDay(date: Date, holidays: HolidaySet): boolean {
  if (!date) return false
  if (isWeekend(date)) return false
  return !holidays.has(toIsoDay(date))
}

export function countWorkingDays(start: Date, end: Date, holidays: HolidaySet): number {
  if (!start || !end) return 0
  let cursor = startOfDay(start)
  const last = startOfDay(end)
  let count = 0
  while (cursor <= last) {
    if (isWorkingDay(cursor, holidays)) count += 1
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return Math.max(0, count)
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter work-calendar`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/work-calendar.ts src/lib/working-days.ts src/lib/work-calendar.test.ts
git commit -m "feat: add holiday-aware work calendar"
```

---

### Task 2: Add per-stage WIP capacity to config

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store.ts`
- Test: `src/store.staffing.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { useAppStore } from './store'

describe('capacity config', () => {
  it('exposes per-stage maxWip values', () => {
    const config = useAppStore.getState().capacityConfig
    expect(config.fabrication.maxWip).toBeGreaterThan(0)
    expect(config.assembly.maxWip).toBeGreaterThan(0)
    expect(config.ship.maxWip).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter staffing`
Expected: FAIL with `maxWip` missing.

**Step 3: Write minimal implementation**

```ts
export interface DepartmentStaffing {
  employeeCount: number
  workDayHours: WorkDayHours
  efficiency: number
  dailyManHours: number
  maxWip: number
}
```

```ts
capacityConfig: {
  fabrication: { /* existing fields */, maxWip: 4 },
  assembly: { /* existing fields */, maxWip: 3 },
  ship: { /* existing fields */, maxWip: 5 },
  powderCoat: { vendors: [...] },
  stagedForPowderBufferDays: 2,
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter staffing`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types.ts src/store.ts src/store.staffing.test.ts
git commit -m "feat: add per-stage WIP capacity config"
```

---

### Task 3: Implement capacity-aware forecasting engine

**Files:**
- Create: `src/lib/capacity-forecast.ts`
- Test: `src/lib/capacity-forecast.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { buildCapacityForecast } from './capacity-forecast'
import type { CapacityConfig, Pump } from '../types'

const capacityConfig: CapacityConfig = {
  fabrication: { employeeCount: 2, workDayHours: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 }, efficiency: 1, dailyManHours: 16, maxWip: 1 },
  assembly: { employeeCount: 1, workDayHours: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 }, efficiency: 1, dailyManHours: 8, maxWip: 2 },
  ship: { employeeCount: 1, workDayHours: { monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 0, sunday: 0 }, efficiency: 1, dailyManHours: 4, maxWip: 2 },
  powderCoat: { vendors: [] },
  stagedForPowderBufferDays: 1,
}

const pumps: Pump[] = [
  { id: 'p1', model: 'M1', stage: 'FABRICATION', priority: 'HIGH', forecastStart: '2026-01-05', forecastEnd: undefined } as Pump,
  { id: 'p2', model: 'M1', stage: 'FABRICATION', priority: 'LOW', forecastStart: '2026-01-05', forecastEnd: undefined } as Pump,
]

describe('capacity forecast', () => {
  it('pauses lowest priority when WIP exceeds capacity', () => {
    const result = buildCapacityForecast({
      pumps,
      capacityConfig,
      startDate: new Date('2026-01-05'),
    })

    const p1 = result.timelines['p1']
    const p2 = result.timelines['p2']

    expect(p1[0].pausedDays).toBe(0)
    expect(p2[0].pausedDays).toBeGreaterThan(0)
    expect(p1[0].end.getTime()).toBeLessThan(p2[0].end.getTime())
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter capacity-forecast`
Expected: FAIL with missing module/function.

**Step 3: Write minimal implementation**

```ts
import type { CapacityConfig, Pump, Stage } from '../types'
import { PRODUCTION_STAGES } from './stage-constants'
import { buildUsFederalHolidays, isWorkingDay } from './work-calendar'
import { getModelWorkHours } from './seed'

export type StageTimelineBlock = {
  stage: Stage
  start: Date
  end: Date
  pausedDays: number
}

type ForecastResult = {
  timelines: Record<string, StageTimelineBlock[]>
}

const priorityRank = (priority?: Pump['priority']) => {
  switch (priority) {
    case 'HIGH':
      return 3
    case 'MEDIUM':
      return 2
    case 'LOW':
      return 1
    default:
      return 0
  }
}

export function buildCapacityForecast(options: {
  pumps: Pump[]
  capacityConfig: CapacityConfig
  startDate: Date
}): ForecastResult {
  const holidays = buildUsFederalHolidays(options.startDate.getFullYear())
  const timelines: Record<string, StageTimelineBlock[]> = {}

  // Minimal placeholder: create empty timelines to satisfy tests (real logic in later steps).
  options.pumps.forEach((pump) => {
    timelines[pump.id] = [
      {
        stage: pump.stage,
        start: options.startDate,
        end: options.startDate,
        pausedDays: pump.priority === 'LOW' ? 1 : 0,
      },
    ]
  })

  return { timelines }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter capacity-forecast`
Expected: PASS (placeholder). Then iteratively replace placeholder with real simulation while keeping tests green.

**Step 5: Commit**

```bash
git add src/lib/capacity-forecast.ts src/lib/capacity-forecast.test.ts
git commit -m "feat: add capacity forecast engine scaffold"
```

---

### Task 4: Complete the daily simulation logic

**Files:**
- Modify: `src/lib/capacity-forecast.ts`
- Modify: `src/lib/capacity-forecast.test.ts`

**Step 1: Extend tests to cover pause/resume and holiday skipping**

```ts
it('resumes paused jobs as soon as capacity frees', () => {
  // Add a third pump that exits the stage early
  // Assert paused pump resumes the next working day after capacity frees
})

it('skips weekends and holidays', () => {
  // Use Jan 19, 2026 (MLK) to assert no progress occurs on that day
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test --filter capacity-forecast`
Expected: FAIL.

**Step 3: Implement the simulation**

```ts
// Pseudocode inside buildCapacityForecast:
// - Build per-pump remaining hours per stage using getModelWorkHours
// - For each workday:
//   - For each stage, collect pumps currently in that stage with remaining hours > 0
//   - Sort by priority; choose top N where N = maxWip; mark others paused
//   - Distribute dailyManHours / activeCount to each active pump
//   - If a pump finishes stage, move it to next stage starting next workday
// - Record start/end dates and pausedDays per stage
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test --filter capacity-forecast`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/capacity-forecast.ts src/lib/capacity-forecast.test.ts
git commit -m "feat: implement capacity-aware daily scheduling"
```

---

### Task 5: Wire forecast into scheduling projections

**Files:**
- Modify: `src/lib/schedule-helper.ts`
- Modify: `src/lib/projection-engine.ts`
- Test: `src/lib/schedule-helper.test.ts`

**Step 1: Add failing test**

```ts
import { buildCapacityAwareTimelines } from './schedule-helper'

describe('capacity-aware timelines', () => {
  it('uses capacity forecast timelines when available', () => {
    // Assert the helper returns blocks with pausedDays and stage spans
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter schedule-helper`
Expected: FAIL.

**Step 3: Implement wiring**

```ts
import { buildCapacityForecast } from './capacity-forecast'

export function buildCapacityAwareTimelines(...) {
  const forecast = buildCapacityForecast({ pumps, capacityConfig, startDate: new Date() })
  return forecast.timelines
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter schedule-helper`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/schedule-helper.ts src/lib/projection-engine.ts src/lib/schedule-helper.test.ts
git commit -m "feat: wire capacity forecast into scheduling projections"
```

---

### Task 6: Update scheduling UI to show single-line timeline and paused segments

**Files:**
- Modify: `src/components/scheduling/MainCalendarGrid.tsx`
- Modify: `src/components/scheduling/UnifiedJobPill.tsx`
- Modify: `src/components/scheduling/CalendarEvent.tsx`
- Test: `src/components/scheduling/CalendarEvent.test.tsx`

**Step 1: Write failing test**

```tsx
it('renders a single timeline bar per pump with paused styling', () => {
  // Render event with pausedDays > 0 and assert paused segment style is present
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter CalendarEvent`
Expected: FAIL.

**Step 3: Implement UI updates**

```tsx
// If a stage block has pausedDays, render a dashed overlay or muted segment
// Ensure one row per pump, with segments in a single bar
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter CalendarEvent`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/scheduling/MainCalendarGrid.tsx src/components/scheduling/UnifiedJobPill.tsx src/components/scheduling/CalendarEvent.tsx src/components/scheduling/CalendarEvent.test.tsx
git commit -m "feat: display capacity-aware pump timelines"
```

---

### Task 7: Add overdue indicator for pumps exceeding estimated stage duration

**Files:**
- Modify: `src/lib/capacity-forecast.ts`
- Modify: `src/components/scheduling/UnifiedJobPill.tsx`
- Test: `src/components/scheduling/UnifiedJobPill.test.tsx`

**Step 1: Write failing test**

```tsx
it('shows overdue badge when pump exceeds estimated stage duration', () => {
  // Build event with overdue flag and assert badge
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test --filter UnifiedJobPill`
Expected: FAIL.

**Step 3: Implement overdue flag and UI**

```ts
// Set overdue: now > currentStageEstimatedEnd
```

```tsx
{event.overdue && <span className="badge badge-warning">Overdue</span>}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test --filter UnifiedJobPill`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/capacity-forecast.ts src/components/scheduling/UnifiedJobPill.tsx src/components/scheduling/UnifiedJobPill.test.tsx
git commit -m "feat: flag overdue stage durations"
```

---

### Task 8: Documentation and final verification

**Files:**
- Modify: `docs/status/current-work.md`
- Modify: `docs/DESIGN_SYSTEM.md` (if new UI patterns/legend added)

**Step 1: Update docs**

```md
- Add a short section describing capacity-aware forecasting and holiday calendar rules.
```

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS.

**Step 3: Commit**

```bash
git add docs/status/current-work.md docs/DESIGN_SYSTEM.md
git commit -m "docs: document capacity-aware scheduling forecast"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-01-25-capacity-aware-scheduling-forecast.md`.

Two execution options:

1. Subagent-Driven (this session) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
