# UI Simplification — Synthesis & Recommendation

**Date**: 2026-02-19  
**Using**: `superpowers/brainstorming` skill  
**Inputs**: 3 prior analyses + fresh codebase review

---

## The Core Insight

All three prior proposals tried to keep too much. The real question isn't "how do I arrange 4 views on one page" — it's **"what does the shop floor manager actually need open at 7am?"**

The answer: **the Kanban board**. Everything else is supplementary.

> "Kanban is truth. Calendar is projection." — PumpTracker Constitution

---

## Three Approaches Compared

### Approach A: "Stacked Sections" (My Earlier Analysis)

KPI Strip → Analytics → Kanban → Orders, all on one scrollable page.

```
HEADER
[KPI Strip]
[▼ Analytics Charts]
[KANBAN BOARD — min-height: 100vh]
[▼ Orders Table]
```

| Pros                              | Cons                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| Everything on one page            | 3+ viewport heights of scrolling                           |
| Collapsible sections give control | Kanban needs full height — scroll past it to get to Orders |
| Low risk, familiar pattern        | Doesn't actually simplify — just stacks                    |

**Verdict**: Rearranges the furniture. Doesn't simplify.

---

### Approach B: "Report-Centric Modal" (Other Agent's Proposal)

Strip the app down to Kanban + KPIs. Dashboard/Charts/Orders all move into a Report Modal with layout sidebar, custom reports, and export.

```
HEADER (with [📊 Reports] button)
[KPI Strip]
[KANBAN BOARD]
[📊] → opens Report Modal (95vw × 90vh) with layout picker
```

| Pros                         | Cons                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| Most radical simplification  | Adds 4 new components (ReportModal, Canvas, LayoutSelector, Exporter)  |
| Kanban IS the app            | Custom report builder is a whole new feature                           |
| Clean separation of concerns | Over-engineered — you're replacing 4 pages with a complex modal system |
| Aligns with constitution     | Removes DigitalDNA (which may be valued)                               |

**Verdict**: Right philosophy, over-engineered execution. Building a report builder is a bigger project than the one you're simplifying.

---

### ⭐ Approach C: "Kanban Hub" (My Recommendation)

Kanban is the app. Charts live in a **slide-out drawer** (not a modal). Scheduling stays as a full-screen modal. Orders page gets eliminated — its data lives in Pump Detail and charts.

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Search | [+ Add PO] | Filter | Theme | ⚙️      │
├────────────────────────────────────────────────────────────────┤
│ KPI STRIP (sticky): Active: 12 │ In Fab: 4 │ Late: 2 │ $1.2M │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   KANBAN BOARD (full viewport, horizontal scroll)              │
│   QUEUE │ FAB │ STAGED │ POWDER │ ASSEMBLY │ SHIP │ CLOSED    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Floating: [📊 Charts] [📅 Schedule] [🤖 Chat]                  │
└────────────────────────────────────────────────────────────────┘
```

When you click `[📊 Charts]`, a **drawer slides in from the right** (~400px wide):

```
┌──────────────────────────────────┬──────────────┐
│   KANBAN BOARD (shrinks)         │ 📊 CHARTS    │
│   Still usable, still visible    │ [Topic ▼]    │
│                                  │ [WIP Donut]  │
│                                  │ [Throughput]  │
│                                  │ [Cycle Time]  │
│                                  │ [Pump Table]  │
│                                  │ [▼ Next Topic]│
└──────────────────────────────────┴──────────────┘
```

**Why a drawer instead of a modal?** Because you can work on Kanban AND see charts at the same time. No other proposal lets you do this. This is the key differentiator.

| Pros                                                      | Cons                                                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| True simplification — fewer things, not rearranged things | Drawer needs responsive handling                        |
| Kanban + Charts visible simultaneously                    | Orders page fully removed (data still in charts/modals) |
| Minimal new code (1 drawer component)                     | Kanban columns squeeze when drawer is open              |
| Aligns with how shop floor managers actually work         |                                                         |
| Scheduling modal already nearly implemented               |                                                         |

**Verdict**: Maximum simplification with minimum new code.

---

## What Each Approach Cuts vs. Adds

|                      | Pages Removed       | Files Deleted | New Components                  | Net Complexity |
| -------------------- | ------------------- | ------------- | ------------------------------- | -------------- |
| **A: Stacked**       | 4 routes → 0 routes | ~3            | 1 (SinglePageLayout)            | Same           |
| **B: Report Modal**  | 3 routes            | ~7            | 4 (ReportModal, Canvas, etc.)   | Higher         |
| **C: Kanban Hub** ⭐ | 4 routes → 0 routes | ~5            | 2 (ChartsDrawer, ScheduleModal) | **Lower**      |

---

## What Happens to Each Current Feature

| Feature                        | In Kanban Hub                                       |
| ------------------------------ | --------------------------------------------------- |
| **KPIs (Active, Late, Value)** | Sticky strip below header — always visible ✅       |
| **Dashboard Charts**           | Charts Drawer (right side, `[📊]` button)           |
| **Dashboard topic cycling**    | Topic dropdown inside the Charts Drawer             |
| **Pump Table / Data mode**     | Chart in drawer (already registered as `pumpTable`) |
| **Kanban Board**               | THE main view — full viewport ✅                    |
| **Pump Detail**                | PumpDetailModal (unchanged) ✅                      |
| **Add PO**                     | AddPoModal (unchanged) ✅                           |
| **Scheduling**                 | Full-screen modal via `[📅]` button                 |
| **Orders / Digital DNA**       | ❌ Removed — PO data available via KPIs + charts    |
| **Print views**                | Unchanged ✅                                        |
| **Kiosk view**                 | Unchanged ✅                                        |
| **Chat Assistant**             | Unchanged ✅                                        |
| **Filters**                    | ControlFlyout stays in header, scoped to Kanban ✅  |
| **CollapseToggle**             | Moved to Kanban section header ✅                   |
| **Nav tabs (4 icons)**         | ❌ Removed — not needed                             |

---

## Files Impact (Kanban Hub approach)

### Delete (~5 files)

- `src/pages/Dashboard.tsx` — route eliminated
- `src/pages/DashboardEngine.tsx` — dead wrapper
- `src/pages/OrdersPage.tsx` — route eliminated
- `src/pages/Kanban.tsx` — merged into main layout
- `src/components/layout/navigation.ts` — no nav needed

### Add (~2 files)

- `src/components/drawers/ChartsDrawer.tsx` — right-side slide-out with chart grid
- `src/components/modals/ScheduleModal.tsx` — full-screen overlay wrapping SchedulingView

### Modify (~4 files)

- `src/App.tsx` — remove routes, single view
- `src/components/layout/Header.tsx` — remove nav tabs, add Charts/Schedule FABs
- `src/components/layout/AppShell.tsx` — remove view switching
- `src/store.ts` — add `chartsDrawerOpen: boolean` state

### Keep As-Is (everything else)

- All 26+ chart components
- `KanbanBoard` and all sub-components
- All modals
- `DashboardEngine.tsx` (component version — powers the Charts Drawer)
- `chartRegistry.ts`, `dashboardConfig.ts`
- Print, kiosk, auth routes
- `ChatAssistant`
