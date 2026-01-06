# Development Guide

## Building and Running

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Development

To run the development server:

```bash
pnpm dev
```

### Build

To build the project for production:

```bash
pnpm build
```

The production-ready files will be in the `dist/` directory.

---

## 🧪 Sandbox Testing Mode (CRITICAL)

> [!IMPORTANT] > **Local development is automatically isolated from production.**
> When you run `pnpm dev`, the app enters **Sandbox Mode** with test data.

### How It Works

| Environment                | Data Source                  | Persistence                   |
| -------------------------- | ---------------------------- | ----------------------------- |
| **Local Dev** (`pnpm dev`) | 40 auto-generated seed pumps | Memory only (lost on refresh) |
| **Production** (Vercel)    | Real Supabase database       | Persisted to cloud            |

### Visual Indicators

When in Sandbox Mode, you will see:

- **Yellow banner** at the top: "SANDBOX MODE ACTIVE"
- **"SIMULATION" badge** confirming test mode
- **Console log**: `🧪 Dev Mode: Loaded sandbox with 15 test pumps`

### Agent Rules for Testing

1. **Add test data freely** — Create POs, move pump cards, test all features
2. **Never click "Commit to Live"** — This pushes sandbox data to production (requires confirmation)
3. **Refresh to reset** — Page refresh regenerates fresh seed data
4. **Production checks require deploy** — To verify production, check `ptl-lova.vercel.app`

### If You Need Production Data Locally

For debugging production issues:

1. Temporarily edit `src/store.ts` → remove the `if (import.meta.env.DEV)` block in `load()`
2. The app will connect to real Supabase
3. **BE EXTREMELY CAREFUL** — changes affect production
4. **Revert immediately** after debugging

---

## Agent Browser Instructions

AI agents with built-in browser capabilities can view the running app:

1. **Start the dev server**:

   ```bash
   pnpm dev
   ```

2. **Use `browser_subagent`** to navigate to `http://localhost:8080/`

3. **Available views**:
   - Dashboard: `/` (default) — KPIs, charts, order table
   - Kanban: Click Kanban icon in header — drag-and-drop stage columns
   - Scheduling: Click calendar icon — backlog dock + calendar grid

## Development Conventions

### Environment Setup

```bash
pnpm install          # install dependencies
pnpm dev              # start Vite on http://localhost:8080
PNPM_TEST_BASE_URL=http://localhost:5173 pnpm playwright test  # see testing.md for details
```

Use **pnpm** for scripts. The dev server will warn if the port is taken; adjust with `pnpm dev --port <port> --host 0.0.0.0` and pass the same URL to Playwright.

### Coding Conventions

- **Components**: colocate feature-specific components under `src/components/<feature>`. Shared primitives belong in `src/components/ui`.
- **State**: extend `src/store.ts` with new selectors/actions rather than adding ad-hoc React state. Persisted settings belong in the Zustand partializer.
- **Styling**: Tailwind for layout + utilities. If a style is reused, promote it to `src/index.css` (see `.header-button`, `.stage-color-*`, `.scrollbar-themed`).
- **Data**: `PumpCard` is the canonical representation of a pump, now reused on both Kanban and Scheduling. If you need different drag behavior, adjust the `draggableConfig` prop instead of duplicating markup.

### Feature Tips

- **Legend Filters**: `schedulingStageFilters` should only influence the scheduling view. If you need a new quick filter, keep it scoped and let the global `filters` state continue to affect every page.
- **Sorting**: Respect `sortField` + `sortDirection` when listing pumps. Import `sortPumps` rather than rolling custom sorts.
- **Calendar Layout**: `MainCalendarGrid` assumes six weeks of data and uses the stage filter set to drop non-selected events. When modifying the timeline, ensure `projectSegmentsToWeek` remains pure.

### How to Add a Feature

1.  **Plan**: capture goals in `docs/README.md` (link to any new design doc).
2.  **Update Store**: add actions/selectors and persist state when needed.
3.  **Implement UI**: reuse `PumpCard`, `Button`, etc. to keep styling consistent.
4.  **Document**: update README and/or `docs/` with any new workflows, configs, or env vars.
5.  **Test**: run `pnpm test` and the relevant Playwright spec before opening a PR.

## Testing

### Unit & Integration (Vitest)

```bash
pnpm test              # run all suites
pnpm test src/store.ts # run a specific file
```

Vitest covers hooks, the Zustand store, scheduling helpers, and core components. Add new specs under `src/` or `tests/components` as appropriate.

### End-to-End (Playwright)

Playwright tests live in `tests/e2e`. The config expects a running dev server; set the base URL with an environment variable:

```bash
pnpm dev &           # start Vite on port 8080
PLAYWRIGHT_TEST_BASE_URL=http://localhost:8080 pnpm playwright test
```

Useful scripts:

- `pnpm playwright test tests/e2e/scheduling-enhanced.spec.ts --project=chromium`
- `pnpm playwright test --headed --project=chromium` (interactive)
- `pnpm playwright test --ui` (Playwright Test UI)

### Verifying the Stage Legend Filters

1.  Seed a few events by dragging jobs from the backlog to the calendar.
2.  Click one of the legend buttons (`data-stage-filter="FABRICATION"`).
3.  Ensure only events whose `data-stage` matches remain.
4.  Click the same button again to clear the quick filter.

The `stage legend filters calendar events` test inside `tests/e2e/scheduling-enhanced.spec.ts` automates this workflow. If it fails, confirm:

- `schedulingStageFilters` is wired through `SchedulingView` to `MainCalendarGrid`.
- Legend buttons have the `data-stage-filter` attribute and call `toggleSchedulingStageFilter`.
- Playwright is pointed at the correct dev server port.

### Linting & Type Checking

- `pnpm lint`
- `pnpm tsc --noEmit`

Run these before publishing a PR.
