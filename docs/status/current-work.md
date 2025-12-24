# Current Work Status

> **Last Updated**: 2025-12-24
> **Active Branch**: `main` > **Deployment Status**: 🚀 **BETA** (Cloud Mode Active)
> **Data Strategy**: **Supabase** (Shared) - `pump` table

> [!IMPORTANT] > **CRITICAL PERSISTENCE FIX APPLIED**
> We recently fixed a major crash where the app tried to write to `pump_api` instead of `pump`.
> **Do not revert changes to `src/adapters/supabase.ts`.**

---

## Completed: Vercel Repair & Persistence ✅

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

### 📦 Pack 5: Future Enhancements -> **START HERE**

1.  Light mode contrast improvements.
2.  Additional modal refinements.
3.  Chart accessibility enhancements.

---

## Test Status

- **Unit Tests**: Passing
- **Build**: Passing (`pnpm build`)

---

## Agent Browser Instructions

1. **Start dev server**: `pnpm dev`
2. **Navigate**: `http://localhost:8080/`
