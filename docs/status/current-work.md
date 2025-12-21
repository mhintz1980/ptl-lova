# Current Work Status

> **Last Updated**: 2025-12-21
> **Active Branch**: `main` @ `611ec60`
> **Last PR**: [#8](https://github.com/mhintz1980/ptl-lova/pull/8) ✅ Merged

---

## Active Workstream: Constitution Refactor

**Reference**: [`docs/agents/opus-4.5-refactor-prompt.md`](../agents/opus-4.5-refactor-prompt.md)

### Phase Status (Opus Refactor A-H)

| Phase | Description                                   | Status      | Notes                                                      |
| ----- | --------------------------------------------- | ----------- | ---------------------------------------------------------- |
| A     | Canonical Stage IDs + Migration               | ✅ Complete | 7 stages, legacy aliasing                                  |
| B     | Truth Layer: Pause/Unpause + Capacity         | ✅ Complete | WIP limits, auto-pause                                     |
| C     | Data model: Merge Testing+Shipping → SHIP     | ✅ Complete | CapacityConfig updated                                     |
| D     | Powder Coat weekly + STAGED_FOR_POWDER buffer | ⚠️ Partial  | Buffer added; **vendor indicator not wired**               |
| E     | Projection Engine (pure)                      | ⚠️ Partial  | SchedulingService exists, full projection-engine.ts needed |
| F     | Calendar UI: projection rendering only        | ⚠️ Partial  | Renamed to forecast hints; old paths remain                |
| G     | Remove/Archive non-compliant code             | ❌ Pending  | schedulePump still exists                                  |
| H     | Tests (projection engine)                     | ⚠️ Partial  | SchedulingService tests done, projection tests needed      |

### Immediate Task: Phase D - Wire Vendor Indicator

Per `docs/agents/opus-4.5-refactor-prompt.md` Phase D:

> Add vendor indicator (icon/text) on pump cards when in STAGED_FOR_POWDER or POWDER_COAT.

**Implementation needed:**

1. Show vendor name/icon on `PumpCard` when `pump.powderCoatVendorId` is set
2. Only display when stage is STAGED_FOR_POWDER or POWDER_COAT
3. Vendor info comes from `capacityConfig.powderCoat.vendors[]`
4. Display only - does NOT affect stage truth

### Next Actions (in order)

1. **→ Phase D**: Wire vendor indicator on pump cards for powder stages
2. Phase E: Create full `src/lib/projection-engine.ts` per spec
3. Phase F: Remove schedulePump/clearSchedule from DragAndDropContext
4. Phase G: Archive or feature-flag non-compliant code
5. Phase H: Add projection engine tests per spec

---

## Following Work: DDD Blueprint

**Reference**: [`DDD_BLUEPRINT-OPUS.md`](../../DDD_BLUEPRINT-OPUS.md)

After Opus refactor phases complete, continue with DDD phases 1-4.

---

## Test Status

- **Unit Tests**: 168/168 passing
- **Gate Script**: `bash scripts/constitution-gate.sh` passes

---

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm test --run       # Run tests (168/168)
bash scripts/constitution-gate.sh  # Verify compliance
```

---

## Remote

| Name     | URL                 | Purpose   |
| -------- | ------------------- | --------- |
| `origin` | mhintz1980/ptl-lova | Main repo |
