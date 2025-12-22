# Current Work Status

> **Last Updated**: 2025-12-21
> **Active Branch**: `main`
> **Last PR**: [#8](https://github.com/mhintz1980/ptl-lova/pull/8) ✅ Merged

---

## Completed: Constitution Refactor ✅

**Reference**: [`docs/agents/opus-4.5-refactor-prompt.md`](../agents/opus-4.5-refactor-prompt.md)

All phases A-H complete. Created `src/lib/projection-engine.ts` as canonical facade.

---

## Completed: DDD Blueprint Implementation ✅

**Reference**: [`DDD_BLUEPRINT-OPUS.md`](../../DDD_BLUEPRINT-OPUS.md)

| Phase | Description                  | Status      |
| ----- | ---------------------------- | ----------- |
| 1     | Domain Core Extraction       | ✅ Complete |
| 2     | Application Layer & Services | ✅ Complete |
| 3     | Infrastructure & Persistence | ✅ Complete |
| 4     | UI Integration               | ✅ Complete |

Domain layer active with `USE_NEW_DOMAIN=true` and `LocalStorageAdapter`.

---

## Completed: Data Capture Improvements ✅

- [x] Made `Value` editable in PumpDetailModal (Model Defaults section)
- [x] Replaced `Lead Days` with editable `Promise Date`
- [x] Completed data inventory audit

---

## Completed: AddPoModal Enhancements ✅

- [x] Auto-populate `valueEach` from catalog when model selected
- [x] Show line subtotals (qty × valueEach)
- [x] Add PO summary footer (total pumps, total value)

---

## Next Actions

### Priority 1: Historical Ledger (2-3 hrs)

- [ ] Create `stage_moves` ledger schema
- [ ] Enrich `PumpStageMoved` events with context (model, customer, po)
- [ ] Calculate `daysInPreviousStage` at write time
- [ ] Build EventBus subscriber to write to ledger

### Priority 3: Dashboard Redesign (1-2 days)

- [ ] Implement dashboard modes (Operations, Value, Production)
- [ ] Add drill-down functionality
- [ ] Build new KPI cards with trends

---

## Test Status

- **Unit Tests**: 172/172 passing
- **Gate Script**: `bash scripts/constitution-gate.sh` passes

---

## Quick Commands

```bash
pnpm dev              # Start dev server (port 8080)
pnpm test --run       # Run tests (168/168)
```

---

## Agent Browser Instructions

AI agents with built-in browser capabilities can view the running app:

1. **Start the dev server** (if not running):

   ```bash
   pnpm dev
   ```

2. **Use `browser_subagent`** to navigate to `http://localhost:8080/`

3. **Available views**:
   - Dashboard: `/` (default) — KPIs, charts, order table
   - Kanban: Click Kanban icon in header — drag-and-drop stages
   - Scheduling: Click calendar icon — backlog dock + calendar grid

---

## Remote

| Name     | URL                 | Purpose   |
| -------- | ------------------- | --------- |
| `origin` | mhintz1980/ptl-lova | Main repo |
