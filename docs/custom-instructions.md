# Custom Instructions for Agentic Developers

Use these when onboarding a new agent so they stay within the current architecture and roadmap.

## What you are building
- PumpTracker Lite: React + TypeScript (Vite), Tailwind, Zustand, Recharts, dnd-kit. Data comes from seed (`src/lib/seed.ts` + `src/data/pumptracker-data.json`); Supabase adapter exists.
- Core flow: add Purchase Orders → pumps appear in Kanban/backlog → schedule jobs → adjust based on dashboard insights → close orders.

## Surfaces & state to respect
- Dashboard: KPIs, workload/value pies, capacity bar, trend, PO table. Data = filtered/sorted pumps from the store.
- Kanban: stage columns with WIP limits; drag/drop `PumpCard` moves stages.
- Scheduling: backlog dock, calendar built from lead times; drag/drop to schedule; leveling helpers.
- Store (`src/store.ts`): pumps, filters, WIP limits, sortField/sortDirection, schedulingStageFilters; adapters persist data.

## In-flight goals (do not drift)
- Dashboard engine: topic/category pills near the header swap chart sets from a registry.
  - Financials: value of open orders; value of scheduled shipments (week/month/quarter); value of completed orders (week/month/quarter).
  - Production Mgmt: build-time stats; ahead/behind jobs; bottleneck/capacity visuals; goal tracking.
  - New charts must use shared `ChartProps` and be registered.
- Scheduling revamp: allow dragging already-scheduled jobs with capacity/man-hour limits; resize durations by dragging bar ends; auto-level toggle; lock specific jobs to dates; rule-based scheduling (e.g., “must start by” guiding leveling/auto-scheduling).

## Required user flow
1) Add PO/customer/lines → pumps created with stage=UNSCHEDULED, serial, value, promise dates.
2) Kanban/backlog: UNSCHEDULED pumps visible; user can drag in Kanban or schedule on calendar.
3) Scheduling: drop to set scheduledStart/End via lead times; revamp adds drag/resize, locks, rules, auto-level.
4) Dashboard drilldown: charts filter by stage/customer/model; insights drive scheduling/kanban adjustments.
5) Close-out: stages progress to CLOSED; dashboard reflects completed value and build-time stats.

## Coding constraints
- Reuse `ChartProps { pumps, filters, onDrilldown }`; register charts in the chart/topic registry.
- Extend the store instead of ad-hoc state; respect existing sorts/filters.
- Reuse UI primitives/styles (`src/components/ui`, `src/index.css`); keep build green (`npm run build`).
- Document and test new behaviors (Vitest for chart drilldowns/scheduling rules).

## What NOT to do
- Don’t introduce disconnected state per view; wire through the store.
- Don’t bypass the registry for new charts.
- Don’t ignore capacity/WIP constraints or new scheduling rules when adding interactions.
