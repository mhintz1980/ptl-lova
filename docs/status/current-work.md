# Current Work Status

> **Last Updated**: 2025-12-22
> **Active Branch**: `main`
> **Deployment Status**: 🚀 **BETA** (Cloud Mode Active)
> **Data Strategy**: **Supabase** (Shared) or Local (Fallback)

> [!IMPORTANT]
> **BETA PROTOCOL IN EFFECT**
>
> 1.  **Architecture**: The app is now configured for **Cloud Mode** using `SupabaseAdapter`.
> 2.  **Deployment**: `main` branch is deployed to Vercel.
> 3.  **Data Reset**: Beta testers are using a fresh, shared database. Do not reset/seed without explicit user authorization.
> 4.  **Guides**:
>     - Deployment: [`docs/process/BETA_DEPLOYMENT.md`](../process/BETA_DEPLOYMENT.md)
>     - Domain Rules: [`docs/constitution/pumptracker-constitution.md`](../constitution/pumptracker-constitution.md)

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

## Completed: Historical Ledger ✅

- [x] Created `StageMoveRecord` interface with enriched fields
- [x] Enriched `PumpStageMoved` events with context (model, customer, po, serial)
- [x] Calculate `daysInPreviousStage` at write time
- [x] Built EventBus subscriber to write to ledger

New storage key: `pumptracker-stage-ledger` (localStorage)

---

## Next Actions

### Priority 1: Polishing Beta Experience (Immediate)

- [ ] Monitor Beta feedback
- [ ] Fix any Cloud Mode sync issues reported
- [ ] Refine mobile responsiveness

### Future Features (Backlog)

- [ ] **KPI Drill-down**: Clicking KPI cards (e.g. "Late Orders") filters the dashboard or opens a list view.
- [ ] **Drag-and-Drop Charts**: Allow users to reorder dashboard widgets using `dnd-kit`.

---

## Test Status

- **Unit Tests**: 182/182 passing
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
