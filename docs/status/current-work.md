# Current Work Status

> [!IMPORTANT] > **READ THIS FILE FIRST** in every new conversation.
> This is the single source of truth for what's happening in the project right now.

> **Last Updated**: 2025-12-27 (Drill-down charts in progress - 3/6 complete)
> **Active Branch**: `main` > **Deployment Status**: 🚀 **BETA** (Cloud Mode Active)
> **Data Strategy**: **Supabase** (Shared) - `pump` table

**Key References**:

- [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — UI standards, chart patterns, drill-down architecture
- [`docs/concepts/Dashboard for PumpTracker App/README.md`](../concepts/Dashboard%20for%20PumpTracker%20App/README.md) — Drill-down chart implementation guide
- [`GEMINI.md`](../../GEMINI.md) — Agent bootloader and documentation map

> [!IMPORTANT] > **CRITICAL PERSISTENCE FIX APPLIED**
> We recently fixed a major crash where the app tried to write to `pump_api` instead of `pump`.
> **Do not revert changes to `src/adapters/supabase.ts`.**

---

## Completed: Vercel Repair & Persistence ✅

- [x] **Adding Vercel Data Persistence**: Configured `.env.local` for local dev and documented Vercel env var requirements.
- [x] **Fixed Vercel Build (AppShell)**: Removed unused `filteredPumpsCount` prop that caused TS build failure.
- [x] **Fixed Vercel Build**: Removed unused imports (`Sparkles`, `toast`).
- [x] **Fixed Data Crash**: Corrected table name `pump_api` -> `pump` in `supabase.ts`.
- [x] **Added Safety**: `store.ts` now catches adapter errors and shows Toast notifications.

---

## Completed: UI/UX Polish ✅

- [x] **PO Modal**: Added customer dropdown + Promise Date inheritance.
- [x] **Visuals**: Removed duplicate chart titles, fixed favorites button.
- [x] **Light Mode**: Increased text contrast.

---

## Completed: Serial Number Gate ✅ (2025-12-24)

- [x] **Serial now nullable**: Pumps created with `serial: null` (unassigned).
- [x] **Stage gate**: Moves to STAGED_FOR_POWDER+ blocked without serial.
- [x] **UI updated**: Shows "Unassigned" badge, edit field placeholder.
- [x] **Toast fix**: No more double toast on blocked drag.

---

## Completed: Agent Skills Integration - Phase 1 ✅ (2025-12-24)

- [x] **GEMINI.md Refactor**: Reduced from 557 to ~200 lines (65% reduction) with progressive disclosure
- [x] **Documentation Separation**: Created `docs/architecture.md`, `docs/development.md`, `docs/deployment.md`
- [x] **Context Engineering**: Added context budget management to `AGENTS.md` (70%/80% thresholds)
- [x] **Session State**: Created `/ai_working/session-state.md` template for task tracking
- [x] **Memory System**: Created `/ai_working/memory/` with domain-patterns, gotchas, conventions templates
- [x] **Degradation Awareness**: Added self-check and recovery sequence to `AGENTS.md`

**Impact**: Agents now start with 65% less context, can manage long sessions, and have cross-session memory.  
**Details**: See [`docs/agent-skills/PHASE1-COMPLETE.md`](../agent-skills/PHASE1-COMPLETE.md)

---

## Completed: Agent Skills Integration - Phase 2 ✅ (2025-12-24)

- [x] **Tool Catalog**: Created `docs/agent-tools.md` with 15+ tools (dev, test, build, lint, E2E, constitution-gate)
- [x] **Tool Design**: Each tool documents what/when/returns, examples, error recovery
- [x] **Multi-Agent Patterns**: Created `docs/multi-agent-patterns.md` with 3 patterns (supervisor, multi-expert, swarm)
- [x] **Handoff Protocol**: Created `/ai_working/handoff.md` template for agent coordination
- [x] **Use Cases**: Documented PumpTracker-specific multi-agent scenarios

**Impact**: Agents can find and use tools efficiently, scale to multi-agent for complex tasks.  
**Details**: See [`docs/agent-skills/PHASE2-COMPLETE.md`](../agent-skills/PHASE2-COMPLETE.md)

---

## Completed: Context Conservation Theme ✅ (2025-12-28)

- [x] **10 Context Rules**: Added quick-reference table to `AGENTS.md`
- [x] **Skill Document**: Created `docs/agent-skills/skills/context-conservation/index.md`
- [x] **Turbo Workflows**: Added `.agent/workflows/quick-commit.md` and `quick-test.md`

**Impact**: Context conservation is now a documented project theme with enforceable rules.  
**Details**: See [`docs/agent-skills/skills/context-conservation/index.md`](../agent-skills/skills/context-conservation/index.md)

---

## Chart Modernization 🎨

**Plan Artifact**: [`docs/plans/chart_modernization.md`](../plans/chart_modernization.md)

### 📦 Pack 1: The Core Engine ✅ **COMPLETE**

- [x] **Created `SparklineAreaChart.tsx`**: Pure SVG + motion/react, bezier curves, 3D depth, hover scanner, drill-down.
- [x] **Verified `DrilldownDonutChart.tsx`**: Already handles null breadcrumbs correctly.

### 📦 Pack 2: The Rings ✅ **COMPLETE** (2025-12-24)

- [x] **Refactored `WipCyclingDonut`**: Removed auto-cycling, added tab switcher (Stage/Customer/Model).
- [x] **Refactored `CycleTimeBreakdown`**: Converted bars to donut with bottleneck highlight.

### 📦 Pack 3: The Trends ✅ **COMPLETE** (2025-12-24)

- [x] **Refactored `TotalValueTrendChart`**: Replaced Recharts BarChart with SparklineAreaChart (253→85 lines).
- [x] **Refactored `LeadTimeTrendChart`**: Replaced Recharts AreaChart with SparklineAreaChart (167→110 lines).

### 📦 Pack 4: Polish & Cleanup ✅ **COMPLETE** (2025-12-24)

- [x] **Chart Sizing**: Added `full` size option. 3D Drill-Down Analysis now spans full row.
- [x] **TotalValueTrend**: Increased from `sm` to `lg` (2 per row).
- [x] **WorkloadDistribution**: Reduced from `lg` to `md` to prevent overlap.
- [x] **ValueByCustomer**: Restyled with `DrilldownDonutChart` + tab switcher (Customer/Model).
- [x] **Drill-Downs**: All charts now drill to intermediate charts, not directly to PumpTable.
- [x] **Overflow Fixes**: Added `overflow-hidden` to chart containers and StagePipeline.

### 📦 Pack 5: Polish & Accessibility ✅ **COMPLETE** (2025-12-24)

- [x] **Light Mode Contrast**: Improved muted-foreground (28%), glass opacity (88%), chart text overrides.
- [x] **Chart Accessibility**: Added ARIA roles, keyboard navigation, screen reader support to SparklineAreaChart, DrilldownDonutChart, CycleTimeBreakdownChart. Created ChartA11yWrapper component.
- [x] **Modal Refinements**: PumpDetailModal now has focus management, aria-modal, ESC key handling, focus restoration.

---

## Chart Modernization - All Packs Complete ✅

All 5 packs of chart modernization are now complete:

- ✅ Pack 1: Core Engine (SparklineAreaChart, DrilldownDonutChart)
- ✅ Pack 2: The Rings (WipCyclingDonut, CycleTimeBreakdown)
- ✅ Pack 3: The Trends (TotalValueTrend, LeadTimeTrend)
- ✅ Pack 4: Polish & Cleanup (sizing, drill-downs, overflow fixes)
- ✅ Pack 5: Accessibility & Light Mode (ARIA, contrast, modal refinements)

---

## 🚧 Active Work: Dashboard Drill-Down Chart Upgrade (2025-12-27)

**Plan**: [`docs/plans/dashboard_drilldown_implementation.md`](../plans/dashboard_drilldown_implementation.md)

**Goal**: Upgrade 5 dashboard charts to use unified drill-down pattern with path-based state, AnimatePresence transitions, breadcrumb navigation, and DrilldownChart3D bar visualization.

### ✅ Completed (Batch 1: Tasks 1-3)

- [x] **Task 1**: Port `DrilldownChart3D` to `src/components/dashboard/charts/` (from concepts folder)
- [x] **Task 2**: Upgrade `CycleTimeBreakdownChart` with drill-down (Donut → Bar breakdown by customer)
- [x] **Task 3**: Upgrade `StagePipelineChart` with drill-down (Pipeline → Bar breakdown by customer)

**Critical Fixes Applied**:

- Fixed missing `motion, AnimatePresence` imports (caused page load failures)
- Fixed age calculations to use `pump.last_update` instead of non-existent `pump.stageEntryTime`/`pump.createdAt`
- Fixed scroll jumping issue by adding `min-h-[300px]` containers with opacity-only transitions
- Fixed TypeScript errors by prefixing unused props with underscore

**Documentation Updated**:

- ✅ `docs/DESIGN_SYSTEM.md`: Added "Critical Implementation Rules" section with Pump interface reference, required imports, age calculation patterns, and scroll preservation patterns
- ✅ `docs/concepts/Dashboard for PumpTracker App/README.md`: Created comprehensive 636-line implementation guide with templates, patterns, debugging checklists

### 🔄 Remaining (Batch 2: Tasks 4-6)

- [ ] **Task 4**: Upgrade `TotalValueTrendChart` with drill-down (Week → Customer value breakdown)
- [ ] **Task 5**: Upgrade `ThroughputTrendChart` with drill-down (Week → Completed pumps by model)
- [ ] **Task 6**: Upgrade `CyclingDonutChart` with drill-down and pause cycling when drilled

**Estimated Time**: ~2 hours for remaining 3 charts

**Known Working Patterns**:

- Path-based state: `useState<string[]>([])`
- AnimatePresence with `mode="wait"` for smooth transitions
- `min-h-[300px]` container to prevent layout collapse
- Opacity-only transitions to prevent scroll jumping
- Use `pump.last_update` for all age/time calculations

---

## Next Available Work

### Option 1: Agent Skills Phase 3 (Optional)

**Plan**: [`docs/agent-skills/integration-plan.md`](../agent-skills/integration-plan.md)

**Completed**:

- ✅ Phase 1: Context Engineering (progressive disclosure, session tracking, memory)
- ✅ Phase 2: Architectural Patterns (tool catalog, multi-agent documentation)

**Phase 3** (Operational Excellence):

- Context optimization (compaction, masking, caching)
- Evaluation framework (quality rubrics, metrics tracking)
- Estimated: 10-12 hours
- Expected: 30% token reduction, systematic quality measurement

### Option 2: New Feature Development

No specific features currently planned. Ready for new product requirements.

---

## Test Status

- **Unit Tests**: Passing
- **Build**: Passing (`pnpm build`)

---

## Agent Browser Instructions

1. **Start dev server**: `pnpm dev`
2. **Navigate**: `http://localhost:8080/`
