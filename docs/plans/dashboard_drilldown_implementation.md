# Dashboard Drill-Down Chart Upgrade

**Goal**: Upgrade remaining dashboard charts to follow the unified drill-down pattern with path-based state, AnimatePresence transitions, breadcrumb navigation, and the `DrilldownChart3D` bar visualization.

**Reference**: [docs/DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) → "Drill-Down Charts" section

---

## Design Decisions (User Confirmed)

1. **Production Pipeline Chart**: Keep unique horizontal pipeline layout, add drill-down alignment with DESIGN_SYSTEM.md
2. **CyclingDonutChart**: Disable tab cycling when drilled into a segment
3. **Drill-Down Visualization**: Use horizontal bar chart style (`DrilldownChart3D`) for all drill-down views
4. **Drill Depth**: One level deep is sufficient (no need for 3 levels)

### Target Drill-Down Style

![Bar chart style for drill-down views](/home/markimus/.gemini/antigravity/brain/ec570e97-88ce-4897-a782-472590c8b56c/uploaded_image_1766817871705.png)

---

## Audit Summary

### ✅ Already Compliant

| Chart                                                                                                                | Visualization           | Status          |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------- |
| [WorkloadDonutChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/WorkloadDonutChart.tsx) | `DrilldownDonutChart`   | ✅ Full pattern |
| [ModelTreemapChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/ModelTreemapChart.tsx)   | `DrilldownTreemapChart` | ✅ Full pattern |

### 🔧 Charts to Upgrade

| Chart                                                                                                                          | Current State             | Target                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------- |
| [CycleTimeBreakdownChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/CycleTimeBreakdownChart.tsx) | Single-level click        | Path state + breadcrumbs     |
| [StagePipelineChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/StagePipelineChart.tsx)           | Single-level click        | Keep layout + add drill-down |
| [TotalValueTrendChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/TotalValueTrendChart.tsx)       | Click action exists       | Week → bar breakdown         |
| [ThroughputTrendChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/ThroughputTrendChart.tsx)       | Passes onDrilldown        | Week → bar breakdown         |
| [CyclingDonutChart](file:///home/markimus/projects/ptl-lova/src/components/dashboard/charts/CyclingDonutChart.tsx)             | Tab cycling, single-click | Disable cycling + drill      |

---

## Proposed Changes

### Phase 1: Port DrilldownChart3D

#### [NEW] DrilldownChart3D.tsx

`src/components/dashboard/charts/DrilldownChart3D.tsx`

Port from [concepts folder](file:///home/markimus/projects/ptl-lova/docs/concepts/Dashboard%20for%20PumpTracker%20App/src/components/DrilldownChart3D.tsx):

- Update imports for local `Card`, `Button` paths
- Export `DrilldownSegment` interface
- Match animation parameters with existing charts

---

### Phase 2: Upgrade Charts (One Level Drill-Down Each)

#### [MODIFY] CycleTimeBreakdownChart.tsx

**Current**: Shows stage donut, click fires `onDrilldown({ stage })`  
**Target**: Click stage → bar chart showing pumps in that stage

```
Level 0: Donut (stages by avg cycle time)
  ↓ click segment
Level 1: Bar chart (pumps in selected stage with age)
  ↑ Home breadcrumb returns to donut
```

Changes:

- Add `useState<string | null>` for selected stage
- When stage selected: compute pumps in stage, render `DrilldownChart3D`
- Add breadcrumb with Home button
- Wrap in `AnimatePresence` for transitions

---

#### [MODIFY] StagePipelineChart.tsx (Production Pipeline)

**Current**: Horizontal pipeline boxes, click fires `onDrilldown({ stage })`  
**Target**: Keep pipeline → click stage → overlay/inline bar breakdown

```
Level 0: Horizontal pipeline (keep unique design)
  ↓ click stage box
Level 1: Bar chart showing pumps in that stage
  ↑ Home breadcrumb returns to pipeline
```

Changes:

- Add `useState<string | null>` for selected stage
- When drilled: show `DrilldownChart3D` inline below pipeline OR as full replacement
- Add breadcrumb navigation
- Wrap content in `AnimatePresence`

---

#### [MODIFY] TotalValueTrendChart.tsx

**Current**: SparklineAreaChart, click does nothing useful  
**Target**: Click week → bar chart of value by customer for that week

```
Level 0: Sparkline trend (value by week)
  ↓ click week point
Level 1: Bar chart (customers contributing to that week's value)
  ↑ Home breadcrumb returns to sparkline
```

Changes:

- Add `useState<string | null>` for selected week
- When week selected: filter pumps by that week, group by customer, render `DrilldownChart3D`
- Show week name in breadcrumb
- AnimatePresence between views

---

#### [MODIFY] ThroughputTrendChart.tsx

**Current**: TrendAreaChart, click triggers onDrilldown  
**Target**: Click week → bar chart of completed pumps by model

```
Level 0: Trend area (throughput by week)
  ↓ click week
Level 1: Bar chart (completed pumps grouped by model for that week)
  ↑ Home breadcrumb returns to trend
```

Changes:

- Add `useState<string | null>` for selected week
- When week selected: filter CLOSED pumps by completion week, group by model
- Render `DrilldownChart3D` with model breakdown
- AnimatePresence transitions

---

#### [MODIFY] CyclingDonutChart.tsx

**Current**: Tab-cycles between Stage/Customer/Model, slice click filters dashboard  
**Target**: Click slice → bar chart breakdown, tab cycling paused

```
Level 0: Cycling donut (Stage | Customer | Model tabs)
  ↓ click slice
Level 1: Bar chart (details for selected slice)
       Tab cycling DISABLED while drilled
  ↑ Home breadcrumb returns to donut, re-enables cycling
```

Changes:

- Add `useState<{ perspective: string; segment: string } | null>` for drill state
- When drilled: set `isPaused = true` automatically
- Show `DrilldownChart3D` with segment details
- Breadcrumb click → clear drill state → resume cycling

---

## Implementation Order

| Step | Task                                                          | Est. Time |
| ---- | ------------------------------------------------------------- | --------- |
| 1    | Port `DrilldownChart3D` to `src/components/dashboard/charts/` | 15 min    |
| 2    | Upgrade `CycleTimeBreakdownChart`                             | 30 min    |
| 3    | Upgrade `StagePipelineChart`                                  | 30 min    |
| 4    | Upgrade `TotalValueTrendChart`                                | 30 min    |
| 5    | Upgrade `ThroughputTrendChart`                                | 30 min    |
| 6    | Upgrade `CyclingDonutChart`                                   | 45 min    |

**Total Estimated Time**: ~3 hours

---

## Verification Plan

### Manual Testing (Recommended)

Run `pnpm dev` → Navigate to `http://localhost:8080/` → Dashboard

#### Test Checklist Per Chart:

| Check          | Description                                         |
| -------------- | --------------------------------------------------- |
| ✅ Render      | Chart displays correctly with real data             |
| ✅ Click       | Clicking segment/point triggers drill-down          |
| ✅ Animation   | Smooth AnimatePresence transition (no jarring jump) |
| ✅ Bar Chart   | Drill-down shows horizontal bar chart style         |
| ✅ Breadcrumb  | Home button appears when drilled                    |
| ✅ Home Click  | Clicking Home returns to original view              |
| ✅ Empty State | If no data at drill level, shows "No data" message  |

#### CyclingDonutChart Specific:

| Check         | Description                             |
| ------------- | --------------------------------------- |
| ✅ Tab Pause  | Tab cycling stops when drilled          |
| ✅ Tab Resume | Tab cycling resumes after clicking Home |

### Existing Tests

No E2E tests exist for chart drill-down. Unit tests in `/tests/` focus on store and components, not visual interactions.

> [!NOTE]
> This is a visual/interaction feature best verified manually. Adding Playwright E2E tests for chart interactions could be a future enhancement.

---

## Summary

- **5 charts** to upgrade with consistent drill-down pattern
- **1 new component** (`DrilldownChart3D`) to port
- All drill-downs use **horizontal bar chart** style
- All drill-downs are **1 level deep**
- Production Pipeline **keeps unique layout**
- CyclingDonutChart **pauses cycling** when drilled
