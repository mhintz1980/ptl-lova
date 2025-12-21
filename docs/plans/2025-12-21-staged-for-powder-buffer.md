# Staged for Powder Buffer Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add constitution-compliant STAGED_FOR_POWDER buffer dwell (working days), settings control, and vendor visibility while keeping truth/event history separate from projection.

**Architecture:** Extend capacity config with a buffer-days setting (default 1, in-memory only when missing), add stage-history helpers to compute completion/elapsed from event history, and update projection to insert a buffer segment and apply vendor throughput gating without mutating truth. UI displays mixed units (hours vs days) and vendor badges.

**Tech Stack:** React + TypeScript, Zustand, date-fns, Vitest.

### Task 1: Update current work spec with clarified requirements

**Files:**
- Modify: `docs/status/current-work.md`

**Step 1: Add Design section 1 clarifications**

Add a subsection (or amend existing) with:

```markdown
#### Design section 1: Data model + configuration

**A. Default + persistence behavior (avoid surprise writes)**
- The setting `stagedForPowderBufferDays` defaults to **1 working day**.
- If the value is missing in persisted settings, treat it as **1 in memory**.
- Do **not** automatically write the default back to storage on load; only persist when the user explicitly saves Settings.

**B. Truth metadata vs stage progress (avoid semantic bleed)**
- `powderCoatVendorId?: string | null` is **truth metadata** about assignment/location, but it **does not** imply stage progress.
- Stage progress remains **only** the result of Kanban stage moves (event history).

**C. Definition: “Completed STAGED_FOR_POWDER” (unambiguous)**
- A pump has completed this stage if it has ever transitioned **out of `STAGED_FOR_POWDER` into `POWDER_COAT` (or beyond)**.
- Do not rely only on “current stage ordering.”

**D. Pumps currently in STAGED_FOR_POWDER (remaining buffer, not re-applying full)**
- If a pump is currently **in** `STAGED_FOR_POWDER`, projection should apply **remaining** buffer time:
  `remainingDays = max(0, bufferDays - elapsedWorkingDaysSinceStageEntry)`
- If the buffer setting changes, projections update accordingly without double counting.

**E. Input constraints**
- `stagedForPowderBufferDays` is an **integer working-days** value, min **0**.
- Weekends count as 0 for working-day math.
```

**Step 2: Add constitution compliance note**

```markdown
**Why this is constitution-compliant**
- Truth: Kanban stage moves only
- Projection: settings-driven dwell + vendor throughput gating
- No projection setting ever mutates truth
```

**Step 3: Add “Implementation notes” placeholder**

```markdown
**Implementation notes**
- (To be filled if code changes diverge from spec expectations)
```

---

### Task 2: Add buffer config + safe defaults (no surprise writes)

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/capacity.ts`
- Modify: `src/store.ts`
- Modify: `src/components/ui/SettingsModal.tsx`

**Step 1: Update CapacityConfig and Pump types**

```ts
export interface CapacityConfig {
  fabrication: DepartmentStaffing
  assembly: DepartmentStaffing
  ship: DepartmentStaffing
  powderCoat: {
    vendors: PowderCoatVendor[]
  }
  stagedForPowderBufferDays: number
}

export interface Pump {
  // ...
  powderCoatVendorId?: string | null
}
```

**Step 2: Add default in `DEFAULT_CAPACITY_CONFIG`**

```ts
export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  fabrication: { /* ... */ },
  assembly: { /* ... */ },
  ship: { /* ... */ },
  powderCoat: { vendors: [/* ... */] },
  stagedForPowderBufferDays: 1,
}
```

**Step 3: Merge persisted settings without writing defaults**

Add a custom persist merge in `src/store.ts`:

```ts
merge: (persisted, current) => {
  const merged = { ...current, ...(persisted as Partial<AppState>) }
  const persistedCapacity = (persisted as Partial<AppState>)?.capacityConfig
  merged.capacityConfig = {
    ...current.capacityConfig,
    ...(persistedCapacity ?? {}),
    stagedForPowderBufferDays:
      persistedCapacity?.stagedForPowderBufferDays ??
      current.capacityConfig.stagedForPowderBufferDays,
  }
  return merged
}
```

**Step 4: Add store setter + Settings input**

```ts
updateStagedForPowderBufferDays: (days) =>
  set((state) => ({
    capacityConfig: {
      ...state.capacityConfig,
      stagedForPowderBufferDays: days,
    },
  }))
```

Add Settings row:

```tsx
<label>Staged for Powder (buffer) — working days</label>
<input type="number" min="0" max="30" step="1" />
<p className="text-xs text-muted-foreground">Buffer time before powder pickup/acceptance.</p>
```

---

### Task 3: Stage history helpers for buffer logic + actuals

**Files:**
- Create: `src/lib/stage-history.ts`
- Modify: `src/infrastructure/events/EventStore.ts`
- Modify: `src/store.ts`

**Step 1: Export storage key**

```ts
export const EVENTS_STORAGE_KEY = 'pumptracker-events'
```

**Step 2: Add stage history helper**

```ts
import type { PumpStageMoved } from '../domain/production/events/PumpStageMoved'
import { EVENTS_STORAGE_KEY } from '../infrastructure/events/EventStore'
import type { Stage } from '../types'

export type StagedForPowderHistory = {
  completed: boolean
  lastEnteredAt?: Date
  lastExitedAt?: Date
}

export function getPumpStageMoveEvents(pumpId: string): PumpStageMoved[] {
  const raw = localStorage.getItem(EVENTS_STORAGE_KEY)
  if (!raw) return []
  const events = JSON.parse(raw)
  return events
    .filter((e: any) => e.aggregateId === pumpId && e.eventType === 'PumpStageMoved')
    .map((e: any) => ({ ...e, occurredAt: new Date(e.occurredAt) }))
}

export function getStagedForPowderHistory(events: PumpStageMoved[]): StagedForPowderHistory {
  let lastEnteredAt: Date | undefined
  let lastExitedAt: Date | undefined
  let completed = false

  events.forEach((event) => {
    if (event.toStage === 'STAGED_FOR_POWDER') {
      lastEnteredAt = event.occurredAt
    }
    if (event.fromStage === 'STAGED_FOR_POWDER') {
      lastExitedAt = event.occurredAt
      if (['POWDER_COAT', 'ASSEMBLY', 'SHIP', 'CLOSED'].includes(event.toStage)) {
        completed = true
      }
    }
  })

  return { completed, lastEnteredAt, lastExitedAt }
}
```

---

### Task 4: Projection updates (buffer + vendor gating + working days)

**Files:**
- Modify: `src/lib/schedule.ts`
- Modify: `src/lib/schedule-helper.ts`
- Modify: `src/store.ts`

**Step 1: Extend `buildStageTimeline` options**

```ts
options?: { startDate?: Date; capacityConfig?: CapacityConfig; stageHistory?: StagedForPowderHistory }
```

**Step 2: Insert STAGED_FOR_POWDER stage and working-day math**

- Include STAGED_FOR_POWDER in durations with `bufferDays` from config.
- If stageHistory.completed, use 0 days.
- If pump.stage === 'STAGED_FOR_POWDER', use remaining buffer days.
- Use `differenceInBusinessDays` and `addBusinessDays` for buffer/vendor stages.

**Step 3: Apply vendor throughput gating in `buildCapacityAwareTimelines`**

- Sort pumps by `forecastStart`.
- Maintain per-vendor weekly buckets of POWDER_COAT starts.
- If vendor weekly capacity is full, extend STAGED_FOR_POWDER until the next available week.

**Step 4: Use capacity-aware timeline for store projections**

- Update `getStageSegments` and `setForecastHint`/`autoSetForecastHints` to use a shared helper that applies buffer + vendor gating.

---

### Task 5: UI updates (Pump Details + Kanban vendor badge)

**Files:**
- Modify: `src/components/ui/PumpDetailModal.tsx`
- Modify: `src/components/kanban/PumpCard.tsx`

**Step 1: Pump Details mixed units**

- Add STAGED_FOR_POWDER row with “Planned: X working days” and “Actual: Y days” using stage history helper.
- POWDER_COAT row should show working days (not hours).
- Work stages show man-hours as today.

**Step 2: Kanban vendor badge**

- When stage is STAGED_FOR_POWDER or POWDER_COAT, show badge:
  - Assigned: `🎨 AlphaCoat`
  - Unassigned: `🎨 Unassigned`

---

### Task 6: Tests (projection + settings behavior)

**Files:**
- Modify: `tests/lib/schedule.spec.ts`
- Modify: `src/lib/schedule-helper.test.ts`
- Modify: `src/store.staffing.test.ts` (or new test file)

**Step 1: Add buffer stage to timeline tests**

```ts
expect(blocks.map((b) => b.stage)).toEqual([
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
])
```

**Step 2: Add working-day buffer tests**

```ts
const bufferBlock = blocks.find((b) => b.stage === 'STAGED_FOR_POWDER')
expect(bufferBlock?.days).toBe(1)
```

**Step 3: Vendor capacity gating test**

- Build two pumps with same vendor and same forecast start.
- Set vendor capacity to 1 per week.
- Expect second pump’s STAGED_FOR_POWDER block to extend at least one week.

**Step 4: Settings default test**

- Simulate missing `stagedForPowderBufferDays` in persisted state and verify in-memory default is 1.

---

### Task 7: Verification

**Step 1: Unit tests**

Run: `pnpm test --run`
Expected: all tests pass

**Step 2: Constitution gate**

Run: `bash scripts/constitution-gate.sh`
Expected: exit 0

---

### Task 8: Update “Implementation notes”

**Files:**
- Modify: `docs/status/current-work.md`

If any deviations from spec were required, add bullet points under “Implementation notes.”
