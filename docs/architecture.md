# Architecture Overview

## Client Surfaces

- **Dashboard** (`src/components/dashboard`) surfaces KPIs, value charts, and the master order table. Data comes directly from the filtered pump array.
- **Kanban** (`src/components/kanban`) renders fixed-width stage columns. Each column receives the globally sorted pump list, and `StageColumn` applies the default ordering (priority → promise date → last update) before rendering `PumpCard`.
- **Scheduling** (`src/components/scheduling`) stitches together three layers:
  - `BacklogDock` reuses `PumpCard` for the unscheduled pump queue.
  - `MainCalendarGrid` builds stage timelines from `buildStageTimeline` and trims them according to the legend filters.
  - `DragAndDropContext` coordinates dnd-kit operations for dropping backlog pumps on the calendar grid.

## State and Data Flow

- **Zustand Store** (`src/store.ts`)
  - Persists pump data, filter selections, WIP limits, and UI toggles.
  - `sortField`/`sortDirection` control the canonical ordering for both Kanban and Scheduling.
  - `schedulingStageFilters` tracks the quick-filter state from the legend buttons; only the scheduling view reads this array.
  - `levelNotStartedSchedules` and `clearNotStartedSchedules` return counts so the UI can show toasts.
- **Seed Data** (`src/lib/seed.ts`)
  - Generates deterministic pumps from `src/data/pumptracker-data.json` for the local adapter.
  - `getModelLeadTimes` supplies fabrication/powder/assembly/testing durations to both the store and calendar timelines.
- **Sorting Helpers** (`src/lib/sort.ts`)
  - Exposes `sortPumps`, `SortField`, and `SortDirection` so different features reuse the same ordering rules.

## Styling & Theming

- `src/index.css` defines shared design tokens, neon shadows, stage color variables, header animations, scrollbars, and the new weekend theme variables.
- Reusable UI primitives live in `src/components/ui` (Button, Badge, Card, etc.).

## File Organization Cheatsheet

```
src/
├── adapters/         # Local + Supabase persistence
├── components/
│   ├── dashboard/
│   ├── kanban/
│   ├── scheduling/
│   ├── toolbar/
│   └── ui/
├── data/             # Catalog data used by seed.ts
├── lib/              # Utilities: formatters, CSV, seed, schedule helpers
├── store.ts          # Zustand store
└── types.ts          # Application types (Pump, Stage, Filters, etc.)
```

Use this map when adding a feature: extend the component surface, update the store (with selectors + actions), and wire any new styling tokens through `index.css`.

## DDD Domain Layer

A clean domain layer was added following Domain-Driven Design principles:

```
src/
├── domain/                    # Pure business logic (NO external imports)
│   ├── shared/Entity.ts       # Base entity class
│   ├── production/
│   │   ├── entities/Pump.ts   # Pump aggregate root
│   │   ├── value-objects/     # Stage, Priority
│   │   ├── events/            # PumpCreated, PumpStageMoved, etc.
│   │   └── repository.ts      # IPumpRepository interface
│   └── sales/
│       ├── entities/          # PurchaseOrder, LineItem
│       └── repository.ts      # IOrderRepository interface
├── application/               # Use case orchestration
│   ├── commands/              # Command definitions
│   └── handlers/              # Command handlers
├── infrastructure/            # External concerns
│   ├── eventBus/              # Domain event pub/sub
│   └── persistence/           # Repository implementations
│       ├── adapters/          # DataAdapter interface + impls
│       └── repositories/      # PumpRepository, OrderRepository
└── presentation/
    └── hooks/usePumpCommands.ts  # React hook for domain operations
```

**Key Invariants Enforced**:

- Stage transitions must be sequential (QUEUE → FABRICATION → POWDER_COAT → ...)
- CLOSED is a terminal stage (no transitions allowed)
- Serial numbers are immutable after creation

**Feature Flag**: Set `USE_NEW_DOMAIN=true` in `usePumpCommands.ts` to activate.
