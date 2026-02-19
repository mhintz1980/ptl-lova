# PumpTracker App Structure Analysis & Simplification Proposal

**Date**: 2026-02-18
**Author**: Architect Mode Analysis
**Status**: Draft for User Review

---

## 1. Current State Summary

### 1.1 Pages/Views

The application currently has **4 main views** accessible via header navigation:

| View | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| **Dashboard** | `/` or `/dashboard` | KPIs, charts, data table | Mode switching (overview/analysis/data), drill-down charts, PumpTable |
| **Kanban** | `/kanban` | Stage management | Drag-and-drop cards, 7 stage columns, WIP limits, pause/unpause |
| **Scheduling** | `/scheduling` | Calendar projection | Backlog dock, calendar grid, forecast hints, Gantt-like timeline |
| **Orders** | `/orders` | Order-level view | Expandable rows, DigitalDNA visualization, order search/filter |

### 1.2 Additional Views

| View | Route | Purpose |
|------|-------|---------|
| **Print Views** | `/print/brief`, `/print/forecast`, `/print/kanban` | Monday brief, capacity forecast, kanban print |
| **Kiosk Views** | `/kiosk` | Shop floor HUD for production floor |
| **Login** | `/login`, `/update-password` | Authentication |

### 1.3 Modals (Global)

- **AddPoModal** - Add new purchase orders
- **PumpDetailModal** - View/edit pump details
- **SettingsModal** - Application settings
- **ShortcutsHelpModal** - Keyboard shortcuts reference
- **ChatAssistant** - AI assistant overlay

### 1.4 Navigation Structure

```
Header (sticky, 60px)
  |-- Logo + Title
  |-- Nav Icons (centered)
  |     |-- Dashboard (BarChart3)
  |     |-- Kanban (Layout)
  |     |-- Scheduling (Calendar)
  |     |-- Orders (Activity)
  |-- Right side: Search, Filters, Theme toggle, Add PO, Settings
```

### 1.5 Domain Model (from Constitution)

**7 Canonical Stages**:
1. QUEUE - Not started
2. FABRICATION - Work stage
3. STAGED_FOR_POWDER - Buffer/waiting
4. POWDER_COAT - Vendor stage
5. ASSEMBLY - Work stage
6. SHIP - Testing + Shipping combined
7. CLOSED - Done

**Key Principle**: "Kanban is truth. Calendar is projection."

---

## 2. Identified Redundancies & Pain Points

### 2.1 Data Overlap Between Views

| Data | Dashboard | Kanban | Scheduling | Orders |
|------|-----------|--------|------------|--------|
| Pump list | Yes (table) | Yes (cards) | Yes (backlog) | - |
| Stage info | Yes (charts) | Yes (columns) | Yes (timeline) | - |
| Order info | Partial | - | - | Yes |
| KPIs | Yes | - | - | - |
| Timeline | - | - | Yes | - |

**Issue**: Users see the same pumps represented differently across 3 views.

### 2.2 Navigation Friction

1. **Context switching cost**: Moving between Dashboard, Kanban, and Scheduling requires full page transitions
2. **Mental model fragmentation**: Users must remember which view has which capability
3. **Redundant filtering**: Each view has its own filter state; filters don't persist across views
4. **No quick comparison**: Cannot see KPIs while working in Kanban

### 2.3 Feature Isolation Problems

| Feature | Location | Problem |
|---------|----------|---------|
| Stage transitions | Kanban only | Cannot move pumps from Dashboard or Scheduling |
| Timeline view | Scheduling only | Cannot see timeline while checking KPIs |
| KPI charts | Dashboard only | Hidden when doing stage management |
| Order details | Orders page | Separate from pump-level views |

### 2.4 Screen Real Estate Issues

- **Kanban**: Horizontal scroll required for 7 columns on most screens
- **Scheduling**: Calendar grid + backlog dock compete for space
- **Dashboard**: Charts stack vertically, requiring scroll

---

## 3. Proposed Simplified Architecture

### 3.1 Design Philosophy

**Core Principle**: One page, multiple lenses. The pump data is the core; views are just different ways to see it.

### 3.2 Proposed Layout: Unified Scrollable Page

```
+------------------------------------------------------------------+
|  HEADER (sticky)                                                  |
|  [Logo] [View Toggle: Kanban | Timeline] [Search] [Filters] [...] |
+------------------------------------------------------------------+
|                                                                    |
|  SECTION 1: KPI BANNER (collapsible)                              |
|  +--------------------------------------------------------------+ |
|  | [WIP Count] [Throughput] [Avg Days] [On Time %]    [^ Collapse]| |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SECTION 2: QUICK CHARTS (horizontal scroll, collapsible)         |
|  +--------------------------------------------------------------+ |
|  | [Stage Distribution] [Customer Breakdown] [Weekly Trend]      | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SECTION 3: PRIMARY WORK AREA (toggle between views)              |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  KANBAN MODE:                                                | |
|  |  +----------------------------------------------------------+ | |
|  |  | QUEUE | FAB | POWDER | ASSEMBLY | SHIP | CLOSED         | | |
|  |  | [card][card]  [card]    [card]    [card] [card]          | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                              | |
|  |  TIMELINE MODE:                                              | |
|  |  +-------------------+--------------------------------------+ | |
|  |  | BACKLOG DOCK      |  CALENDAR GRID                       | | |
|  |  | [pump list]       |  [Gantt-style timeline]              | | |
|  |  +-------------------+--------------------------------------+ | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SECTION 4: DATA TABLE (expandable, replaces Orders page)         |
|  +--------------------------------------------------------------+ |
|  | [Expand/Collapse Data Table]                                 | |
|  | PO | Customer | Model | Stage | Progress | Promise | Actions  | |
|  | ...                                                          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 3.3 View Toggle Mechanism

Replace the 4-icon navigation with a **2-mode toggle**:

```
[Kanban] [Timeline]
```

- **Kanban Mode**: Shows stage columns (primary work view)
- **Timeline Mode**: Shows calendar grid + backlog dock (planning view)

The Dashboard KPIs and charts are **always visible** at the top (collapsible).

### 3.4 Feature Migration Map

| Current Feature | New Location | Access Method |
|-----------------|--------------|---------------|
| Dashboard KPIs | Section 1 (top) | Always visible, collapsible |
| Dashboard Charts | Section 2 | Horizontal scroll, collapsible |
| Dashboard Table | Section 4 | Expandable panel |
| Kanban Board | Section 3 - Kanban mode | View toggle |
| Scheduling Calendar | Section 3 - Timeline mode | View toggle |
| Backlog Dock | Section 3 - Timeline mode | View toggle |
| Orders Page | Section 4 | Integrated into data table |
| Pump Detail | Modal (unchanged) | Click any pump |
| Add PO | Modal (unchanged) | Header button |

### 3.5 Mobile Responsiveness Strategy

**Desktop (>1024px)**:
- Full 7-column Kanban visible
- Side-by-side timeline + backlog
- Charts in horizontal row

**Tablet (768-1024px)**:
- Kanban: 4 visible columns, horizontal scroll
- Timeline: Stacked (backlog above calendar)
- Charts: Carousel

**Mobile (<768px)**:
- KPI banner only (charts hidden, expandable)
- Kanban: 2 columns + stage selector dropdown
- Timeline: Full-width calendar, backlog as drawer
- Data table: Card list view

---

## 4. Migration Considerations

### 4.1 What Changes

| Component | Change Type | Impact |
|-----------|-------------|--------|
| `App.tsx` | Major refactor | Remove route-based view switching |
| `Header.tsx` | Modify | Replace 4-icon nav with 2-mode toggle |
| `Dashboard.tsx` | Refactor | Split into KPI banner + charts + table sections |
| `Kanban.tsx` | Minor | Become a mode, not a page |
| `SchedulingView.tsx` | Minor | Become a mode, not a page |
| `OrdersPage.tsx` | Major refactor | Merge into data table section |
| `navigation.ts` | Simplify | Remove 4-view enum, use 2-mode |

### 4.2 What Stays the Same

- All modals (AddPoModal, PumpDetailModal, SettingsModal, etc.)
- Store structure and state management
- API adapters and data fetching
- Print views and kiosk views (separate routes)
- Authentication flow
- All domain logic (stage transitions, WIP limits, etc.)

### 4.3 New Components Needed

1. **KPIBanner** - Collapsible KPI strip
2. **QuickCharts** - Horizontal scrolling chart carousel
3. **ViewToggle** - Kanban/Timeline mode switcher
4. **DataTablePanel** - Expandable data table section
5. **UnifiedLayout** - New scrollable container

### 4.4 URL Structure Change

**Before**:
```
/           -> Dashboard
/kanban     -> Kanban
/scheduling -> Scheduling
/orders     -> Orders
```

**After**:
```
/           -> Unified page (default: Kanban mode)
/?view=timeline -> Unified page (Timeline mode)
/print/*    -> Print views (unchanged)
/kiosk/*    -> Kiosk views (unchanged)
```

---

## 5. Trade-offs

### 5.1 Benefits

| Benefit | Impact |
|---------|--------|
| **Reduced navigation friction** | Users see KPIs while working in Kanban |
| **Unified context** | No mental switching between pages |
| **Faster workflows** | Stage moves + KPI updates in one view |
| **Better data visibility** | Charts and table always accessible |
| **Simpler mental model** | One page with two modes |
| **Mobile-friendly** | Scroll-based navigation works better on mobile |

### 5.2 Drawbacks

| Drawback | Mitigation |
|----------|------------|
| **Larger initial payload** | Lazy-load chart components |
| **Scroll fatigue** | Collapsible sections, remember preferences |
| **Lost deep-linking to views** | Use query params (?view=timeline) |
| **Potential information overload** | Progressive disclosure, smart defaults |
| **Learning curve for existing users** | Onboarding tooltip, familiar patterns |

### 5.3 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users prefer separate pages | Medium | High | A/B test, provide preference toggle |
| Performance degradation | Low | Medium | Virtualization, lazy loading |
| Mobile layout issues | Medium | Medium | Dedicated mobile testing |
| Breaking existing bookmarks | High | Low | Redirect old routes to new URLs |

---

## 6. Implementation Phases

### Phase 1: Foundation
- Create UnifiedLayout component
- Implement ViewToggle component
- Refactor Header navigation

### Phase 2: Section Migration
- Extract KPIBanner from Dashboard
- Create QuickCharts carousel
- Integrate KanbanBoard as a mode

### Phase 3: Timeline Integration
- Integrate SchedulingView as a mode
- Ensure state persistence between modes

### Phase 4: Data Table
- Merge OrdersPage functionality into DataTablePanel
- Implement expandable table section

### Phase 5: Polish
- Mobile responsive testing
- Performance optimization
- User preference persistence
- Route redirects for backward compatibility

---

## 7. Alternative Approaches Considered

### 7.1 Tab-Based Layout (Rejected)

```
[KPIs] [Kanban] [Timeline] [Orders]
```

**Why rejected**: Still requires clicking between tabs, doesn't solve context-switching problem.

### 7.2 Sidebar Navigation (Rejected)

```
+--------+------------------+
| Nav    | Content          |
| Items  |                  |
+--------+------------------+
```

**Why rejected**: Reduces horizontal space for Kanban columns, doesn't improve visibility.

### 7.3 Dashboard-Only with Expandable Sections (Rejected)

Keep Dashboard as main view, add Kanban as expandable.

**Why rejected**: Kanban is the primary work view per constitution ("Kanban is truth"), should not be secondary.

---

## 8. Questions for User

Before proceeding with implementation, I'd like clarification on:

1. **Primary use case**: Is Kanban the main daily driver, or do users spend equal time across views?

2. **Chart importance**: Are the Dashboard charts critical for daily operations, or mostly for management reporting?

3. **Orders page usage**: How frequently is the Orders page used? Is it primarily for order-level details that aren't visible in pump views?

4. **Mobile usage**: What percentage of users access the app on mobile devices?

5. **Existing user feedback**: Have users complained about navigation or expressed a preference for consolidated views?

---

## 9. Summary

This proposal consolidates 4 separate pages into a single scrollable interface with 2 modes (Kanban/Timeline). The KPIs and charts remain visible at the top, while the primary work area toggles between stage management and calendar planning. The data table becomes an expandable section at the bottom.

**Key insight**: The pump data is the core asset. Views are just different lenses. By unifying the interface, users can work with pumps without losing context of KPIs or timeline projections.

**Next step**: User review and feedback on the proposed architecture before implementation planning.