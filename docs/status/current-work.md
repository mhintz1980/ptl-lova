# Current Work Status

> **Last Updated**: 2025-12-21
> **Active Branch**: `refactor/constitution-projection` → tracking `origin/refactor/constitution-projection`
> **PR**: [#8](https://github.com/mhintz1980/ptl-lova/pull/8) (open, ready for review)

---

## Active Workstream: Constitution Refactor

**Reference**: [`docs/agents/opus-4.5-refactor-prompt.md`](../agents/opus-4.5-refactor-prompt.md)

### Phase Status (Opus Refactor A-H)

| Phase | Description                                   | Status      | Notes                                                      |
| ----- | --------------------------------------------- | ----------- | ---------------------------------------------------------- |
| A     | Canonical Stage IDs + Migration               | ✅ Complete | 7 stages, legacy aliasing                                  |
| B     | Truth Layer: Pause/Unpause + Capacity         | ✅ Complete | WIP limits, auto-pause                                     |
| C     | Data model: Merge Testing+Shipping → SHIP     | ✅ Complete | CapacityConfig updated                                     |
| D     | Powder Coat weekly + STAGED_FOR_POWDER buffer | ⚠️ Partial  | Buffer added; vendor indicator not wired                   |
| E     | Projection Engine (pure)                      | ⚠️ Partial  | SchedulingService exists, full projection-engine.ts needed |
| F     | Calendar UI: projection rendering only        | ⚠️ Partial  | Renamed to forecast hints; old paths remain                |
| G     | Remove/Archive non-compliant code             | ❌ Pending  | schedulePump still exists                                  |
| H     | Tests (projection engine)                     | ⚠️ Partial  | SchedulingService tests done, projection tests needed      |


### Design section 1: Data model + configuration

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

**Why this is constitution-compliant**
- Truth: Kanban stage moves only
- Projection: settings-driven dwell + vendor throughput gating
- No projection setting ever mutates truth

**Implementation notes**
- (To be filled if code changes diverge from spec expectations)

### Next Actions (in order)

1. Complete Phase D: Wire vendor indicator on pump cards for powder stages
2. Complete Phase E: Create full `src/lib/projection-engine.ts` per spec
3. Complete Phase F: Remove schedulePump/clearSchedule from DragAndDropContext
4. Complete Phase G: Archive or feature-flag non-compliant code
5. Complete Phase H: Add projection engine tests per spec

---

## Following Work: DDD Blueprint

**Reference**: [`DDD_BLUEPRINT-OPUS.md`](../../DDD_BLUEPRINT-OPUS.md)

After Opus refactor phases complete, continue with:

| Phase | Description                   | Status                              |
| ----- | ----------------------------- | ----------------------------------- |
| 1     | Domain Core Extraction        | ⚠️ Partial (some entities exist)    |
| 2     | Application Layer & Services  | ⚠️ Partial (command handlers exist) |
| 3     | Infrastructure & Persistence  | ❌ Pending                          |
| 4     | Verification & UI Integration | ❌ Pending                          |

---

## Test Status

- **Unit Tests**: 162/162 passing
- **Gate Script**: `bash scripts/constitution-gate.sh` passes
- **E2E**: Not currently run (TODO)

---

## Quick Commands

```bash
# Development
pnpm dev
pnpm test --run

# Verify constitution compliance
bash scripts/constitution-gate.sh

# Check PR status
gh pr view 8 --repo mhintz1980/ptl-lova
```

---

## Remote

| Name     | URL                 | Purpose   |
| -------- | ------------------- | --------- |
| `origin` | mhintz1980/ptl-lova | Main repo |
