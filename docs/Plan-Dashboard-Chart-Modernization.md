Plan: Dashboard Chart Modernization
🎯 Goal
Upgrade all dashboard charts to match the "Premium" aesthetic of the new 3D Drill-Down charts. Key Standard: Remove Recharts dependencies where possible in favor of native motion/react + SVG for maximum control over animations, gradients, and 3D depth.

🎨 Design Standards (The "New Look")
Feature Standard Implementation
Engine motion/react (SVG Paths) instead of Recharts
Depth 3D Layers: Main shape + Offset opacity layer (shadow)
Animation Entrance: draw (pathLength) + fade + scale
Exit: layout animations for smooth morphing
Interaction Hover: Scale (1.05x) + Brightness (1.1x)
Click: Smooth drill-down with exit animations
Colors Neon Palette: High-saturation gradients with "glass" opacity (0.7 fill)
✅ Approved Interactions
Decision 1: Manual Drill-Down over Auto-Cycle The "Cycling" charts (WIP Donut) will STOP auto-rotating. Instead, they will present a high-level "Overview" (e.g., Total WIP) that users can click to slice by Customer, Model, or Stage.

Decision 2: Interactive Trends "Sparkline" charts will be interactive. Clicking a specific month/week point (e.g., "Nov 2025") will drill down into the detailed data for that specific period.

🚀 Upgrade Specs

1. New Component: SparklineAreaChart
   A premium replacement for Recharts
   AreaChart
   .

Visuals: Smooth bezier curves, vertical gradient fill (Neon → Transparent), "Drawing" entrance animation.
Interaction:
Hover: Vertical "scanner" line + Glow dot that snaps to the nearest data point.
Click: Emits onPointClick(dataPoint) event.
Drill-Down Flows:
Lead Time Trend → Click Month → Show
PumpTable
(Completed in that month).
Value Trend → Click Week → Show
Treemap
(Value breakdown for that week). 2. WIP Overview (
WipCyclingDonut
Replacement)
Engine:
DrilldownDonutChart
.
Mode: "Overview".
Interaction:
Center: Shows Total Count.
Segments: "By Stage" (default).
Click Segment (e.g., "Fabrication") → Drills into
PumpTable
filtered by that stage. 3. Value Treemap (
TreemapChart
)
Engine:
DrilldownTreemapChart
(Squarified).
Updates:
Add logic to handle "Time Filtered" data (passed from a parent trend drill-down).
Fix "Total Value" label overlap issue.
🤖 Subagent Execution Strategy
To execute this perfectly, we will split the work into 3 Focused Packs. You can start a new conversation for each pack to keep context fresh.

📦 Pack 1: The Core Engine (High Complexity)
Goal: Build the reusable SparklineAreaChart and update
DrilldownDonut
.

Create SparklineAreaChart.tsx: Implement SVG bezier path logic + interactions.
Update
DrilldownDonutChart.tsx
: Ensure it handles "null" breadcrumbs correctly for the initial view.
Deliverable: 2 robust, verified chart primitives ready for data.
📦 Pack 2: The Rings (Medium Complexity)
Goal: Migrate circular charts.

Refactor
WipCyclingDonut
: Remove cycling logic, implement
DrilldownDonutChart
with "Overview" mode.
Refactor
CycleTimeBreakdown
: Convert to
DrilldownDonutChart
.
Deliverable: All donut charts are now 3D, interactive, and consistent.
📦 Pack 3: The Trends (Medium Complexity)
Goal: Migrate time-series charts.

Refactor
TotalValueTrend
: Use SparklineAreaChart. Wire Click -> Treemap drill-down.
Refactor LeadTimeTrend: Use SparklineAreaChart. Wire Click -> PumpTable.
Deliverable: All trend charts draw beautifully and are interactive.
📦 Pack 4: Polish & Cleanup (Low Complexity)
Goal: Final visual sweeps.

Address the remaining "To-Do" items (Light mode fixes, modal tweaks).
Visual QA of all new charts.
