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
