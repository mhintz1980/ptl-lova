# PumpTracker Design System Standards

**Version**: 1.1
**Last Updated**: 2025-12-27
**Purpose**: Ensure consistent, accessible, and beautiful UI across all components

---

## 🎯 Core Principles

1. **Accessibility First**: All UI elements must be readable and interactive in both light and dark modes
2. **Clear Visual Hierarchy**: Headers, buttons, and actions should be immediately obvious
3. **Generous Touch Targets**: Minimum 44×44px for interactive elements
4. **Consistent Spacing**: Use 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
5. **Responsive by Default**: Mobile-first, scale up

---

## 📏 Component Standards

### Modals & Dialogs

**Sizing:**

- **Small**: `max-w-md` (448px) - Confirmation dialogs, alerts
- **Medium**: `max-w-2xl` (672px) - Forms, detail views
- **Large**: `max-w-4xl` (896px) - Complex forms, tables
- **Full-screen on mobile**: `w-full h-full` on screens < 768px

**Scroll Behavior:**

```tsx
// ✅ CORRECT - Modal with scrollable content
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-3xl border border-border bg-card shadow-layer-lg">
    {/* Fixed Header */}
    <div className="flex-shrink-0 border-b border-border px-6 py-5">
      <h2 className="text-xl font-semibold text-foreground">Title</h2>
    </div>

    {/* Scrollable Body */}
    <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
      {/* Content */}
    </div>

    {/* Fixed Footer */}
    <div className="flex-shrink-0 border-t border-border px-6 py-4">
      {/* Actions */}
    </div>
  </div>
</div>

// ❌ WRONG - No max-height, content gets cut off
<div className="w-full rounded-3xl">
  {/* Content overflows */}
</div>
```

**Header Standards:**

- Title: `text-xl font-semibold text-foreground` (20px, 600 weight)
- Subtitle: `text-xs text-muted-foreground` (12px, muted)
- Close button: Top-right, `text-muted-foreground hover:text-foreground`

---

### Chart Color Standards

**All charts MUST display colors visibly.**

```tsx
// ✅ CORRECT - Proper z-index management with layer-l1
<Card className="layer-l1 overflow-hidden !bg-card !relative">
  <style>{`.layer-l1 { isolation: isolate; }`}</style>
  <CardHeader className="!relative z-20">
  <CardContent className="!relative z-10">
    <div className="min-h-[300px] relative z-10">
      <svg>{/* Chart elements */}</svg>
    </div>
  </CardContent>
</Card>

// ❌ WRONG - No z-index, causes stacking issues
<Card className="layer-l1 overflow-hidden">
  {/* Colors hidden behind background */}
</Card>

// ❌ WRONG - Removing layer-l1 loses visual styling
<Card className="rounded-2xl border border-border/60 bg-card">
  {/* Wrong appearance */}
</Card>
```

**Key Rules:**

1. **Keep `layer-l1` class** for visual styling
2. **Add `!bg-card !relative`** to override layer-l1 background
3. **Add `<style>{`.layer-l1 { isolation: isolate; }`}</style>`** for stacking context
4. **Add explicit z-index**: `z-20` for header, `z-10` for content
5. **Always add `min-h-[300px]`** to chart containers
6. **Remove `AnimatePresence`** around single SVG elements
7. **Use solid colors, not gradients**: `fill={color} fillOpacity="0.9"`
8. **Reduce shadow opacity**: 15% for shadows (0.15), 40% for edge highlights (0.4)
9. **Adjust shadow filters**: Use slope of 0.2, not 0.3-0.4

**Color Palette Standard:**

```tsx
const CHART_COLORS = [
  '#06b6d4', // Cyan
  '#d946ef', // Magenta
  '#f97316', // Orange
  '#22c55e', // Green
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#3b82f6', // Blue
]
```

**Animation Pattern:**

```tsx
// ✅ CORRECT - Animate individual elements, not container
{
  segments.map((segment) => (
    <motion.path
      key={segment.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  ))
}

// ❌ WRONG - AnimatePresence with single child causes warning
;<AnimatePresence mode="wait">
  <motion.div>...</motion.div>
</AnimatePresence>
```

---

### Charts & Data Visualizations

**12-Column Grid System:**

```
Row Layout (12 columns total):
┌─────────┬─────────┬─────────┐
│  small  │  small  │  small  │  ← 3 small charts (4 cols each)
│  (4)    │  (4)    │  (4)    │
├─────────┴─────────┴─────────┤
│     large    │   small     │  ← 1 large + 1 small (8 + 4 cols)
│     (8)      │    (4)      │
├─────────────────────────────┤
│          max                │  ← 1 max chart (12 cols)
│          (12)               │
└─────────────────────────────┘
```

**Grid Setup:**

```tsx
// ✅ CORRECT - 12-column grid with equal row heights
<div className="grid gap-6 grid-cols-12 grid-flow-dense flex-1 auto-rows-fr">
  {/* Charts automatically size and align */}
</div>

// ❌ WRONG - Uneven sizing, inconsistent heights
<div className="grid grid-cols-2 xl:grid-cols-4">
  {/* Charts don't align properly */}
</div>
```

**Chart Sizing Types:**

```tsx
// Small - 4 columns (1/3 width)
<div className="md:col-span-4 col-span-12">...</div>

// Large - 8 columns (2/3 width)
<div className="md:col-span-8 col-span-12">...</div>

// Max - 12 columns (full width)
<div className="md:col-span-12 col-span-12">...</div>

// Mobile fallback: All charts stack full-width on small screens
```

**Responsive Container Pattern:**

```tsx
// ✅ CORRECT - Charts that fill available space
<div className="flex flex-col min-h-[calc(100vh-80px)]">
  {/* Header - flex-shrink-0 prevents shrinking */}
  <div className="flex-shrink-0">
    {/* Title, filters, etc */}
  </div>

  {/* Chart Grid - flex-1 takes remaining space */}
  <div className="grid gap-6 grid-cols-12 grid-flow-dense flex-1 auto-rows-fr">
    {/* Chart Card */}
    <div className="md:col-span-4 col-span-12 flex flex-col">
      {/* Chart Header - fixed size */}
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-lg font-semibold">Chart Title</h2>
      </div>

      {/* Chart Container - grows to fill */}
      <div className="flex-1 w-full relative overflow-hidden min-h-0">
        <ChartComponent />
      </div>
    </div>
  </div>
</div>

// ❌ WRONG - Fixed height prevents responsive growth
<div className="h-[300px]">
  {/* Content gets cut off */}
</div>
```

**Key Principles:**

1. **12-column grid**: `grid-cols-12` (desktop), `col-span-12` (mobile)
2. **Equal row heights**: `auto-rows-fr` ensures all charts in same row are equal height
3. **Parent container**: `flex flex-col min-h-[calc(100vh-header)]`
4. **Grid container**: Add `flex-1` to grow and fill space
5. **Chart cards**: `flex flex-col` (no min-height, let grid control)
6. **Chart container**: `flex-1 min-h-0` (critical! allows shrinking below content size)
7. **Header/footer**: `flex-shrink-0` (prevents unwanted shrinking)

**Why `auto-rows-fr` matters:**

- Makes all rows in the grid equal height
- Charts automatically stack properly in rows
- No manual height management needed

**Why `min-h-0` matters:**

- Flex items have default `min-height: auto` which prevents them from shrinking below their content size
- `min-h-0` overrides this, allowing the chart container to shrink properly
- Without it, charts won't respond to viewport changes

**Drill-Down Mode:**

```tsx
// Full viewport height for drill-down
<div className="flex flex-col min-h-[calc(100vh-200px)]">
  {/* Chart takes almost full screen */}
</div>
```

**Mobile Responsive:**

```tsx
// All charts stack full-width on mobile
className = 'md:col-span-4 col-span-12' // small
className = 'md:col-span-8 col-span-12' // large
className = 'md:col-span-12 col-span-12' // max
```

### Donut Chart Standard

**Geometry:**

- **Display Size**: `250px` width, `225px` height
- **ViewBox**: `0 0 400 360`
- **Center**: `cx=200`, `cy=180` (perfect vertical alignment)
- **Radius**: `outer=160`, `inner=80`

**Layout:**

- **Header**: Standard relative positioning (`!relative`)
- **Content**: Flex column, centered (`justify-center items-center`)
- **Spacing**: `gap-2` between donut and legend

**Typography:**

- **Center Label**: `text-sm text-muted-foreground` (e.g., "Total")
- **Center Value**: `text-2xl font-bold`
- **Segment Label**: `text-sm font-medium` (inside donut)
- **Legend Text**: `text-[10px]`

---

### Drill-Down Charts

**⚠️ CRITICAL: TypeScript Interface Requirements**

Before implementing drill-down charts, understand the Pump interface and required imports:

```tsx
// PUMP INTERFACE - Know these properties exist
import { Pump } from '../../../types'

interface Pump {
  id: string
  serial: number | null
  po: string
  customer: string
  model: string
  stage: Stage
  priority: Priority
  powder_color?: string
  last_update: string // ✅ USE THIS for age calculations (ISO timestamp)
  value: number
  forecastEnd?: string
  forecastStart?: string
  isPaused?: boolean
  pausedAt?: string
  pausedStage?: Stage
  totalPausedDays?: number
  promiseDate?: string
  work_hours?: { fabrication: number; assembly: number; ship: number }
  powderCoatVendorId?: string | null
}

// ⚠️ PROPERTIES THAT DO NOT EXIST (will cause TypeScript errors):
// pump.stageEntryTime  ❌ Does NOT exist
// pump.createdAt        ❌ Does NOT exist
// pump.entryTime        ❌ Does NOT exist
```

**Required Imports for Drill-Down Charts:**

```tsx
// ✅ CORRECT - All required imports
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react' // ← CRITICAL for transitions
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'

// ❌ WRONG - Missing motion/AnimatePresence causes page load failures
import { useState, useMemo } from 'react'
import { DrilldownChart3D } from './DrilldownChart3D'
// Missing: AnimatePresence import → TypeScript errors, runtime failures
```

**Age Calculation Pattern (Time in Stage):**

```tsx
// ✅ CORRECT - Calculate age using last_update
const ageInMs = Date.now() - new Date(pump.last_update).getTime()
const ageInDays = ageInMs / (1000 * 60 * 60 * 24)

// ❌ WRONG - Using non-existent properties
const ageInMs =
  Date.now() - new Date(pump.stageEntryTime || pump.createdAt).getTime()
// TypeScript error: Property 'stageEntryTime' does not exist on type 'Pump'
```

**Handling Unused Props:**

```tsx
// ✅ CORRECT - Prefix unused props with underscore
export function MyChart({ onDrilldown: _onDrilldown }: ChartProps) {
  // _onDrilldown indicates intentionally unused
}

// OR use full props object with underscore
export function MyChart(_props: ChartProps) {
  // All props intentionally unused
}

// ❌ WRONG - Leaving unused props causes TypeScript errors
export function MyChart({ onDrilldown }: ChartProps) {
  // TypeScript error: 'onDrilldown' is declared but its value is never read
}
```

**Scroll Position Preservation Pattern:**

```tsx
// ✅ CORRECT - Prevent page jumping on drill-down
return (
  <div className="w-full h-full flex flex-col min-h-[300px]">
    {' '}
    {/* ← Outer container with fixed height */}
    <AnimatePresence mode="wait">
      {drilldownPath.length === 0 ? (
        <motion.div
          key="donut"
          initial={{ opacity: 0 }} // ← Opacity-only, no layout shifts
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full" // ← Fill container
        >
          <DrilldownDonutChart />
        </motion.div>
      ) : (
        <motion.div
          key="drilldown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <DrilldownChart3D />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

// ❌ WRONG - Causes page to jump to top on drill-down
return (
  <div>
    {drilldownPath.length === 0 ? (
      <DrilldownDonutChart /> // ← No consistent container height
    ) : (
      <DrilldownChart3D />
    )}
  </div>
)
```

**Key Rules for Drill-Down Charts:**

1. **Always import motion/AnimatePresence** from 'motion/react' - required for AnimatePresence
2. **Use `pump.last_update`** for all time/age calculations - NOT stageEntryTime/createdAt
3. **Prefix unused props** with underscore (`_props` or `{ onDrilldown: _onDrilldown }`)
4. **Wrap views in consistent container** with `min-h-[300px]` to prevent layout collapse
5. **Use opacity-only transitions** (no scale/rotate) to prevent scroll position resets
6. **Maintain `w-full h-full`** on inner motion.div elements

---

**Architecture Overview:**

Drill-down charts use a two-layer architecture:

| Type                       | Examples                                                           | Role                                          |
| -------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| **Wrapper/Controller**     | `CustomerDrilldownChart`, `StatusDrilldownChart`                   | Manage drill-down state & data transformation |
| **Reusable Visualization** | `DrilldownChart3D`, `DrilldownDonutChart`, `DrilldownTreemapChart` | Pure presentation with animation              |

**Why This Works:**

- The chart component stays **mounted** throughout navigation
- Only the `data` prop changes—no page navigation or new component mounting
- The rest of the dashboard is unaffected because no DOM outside the chart is modified

---

**State Management Pattern:**

```tsx
// ✅ CORRECT - Path-based drill-down state
const [drilldownPath, setDrilldownPath] = useState<string[]>([])

// Path examples:
// []                     → Top level ("All Customers")
// ["CustomerA"]          → First drill-down level
// ["CustomerA", "PO-123"] → Second drill-down level
```

**Data Computed from Path:**

```tsx
// ✅ CORRECT - useMemo derives current view from path
const currentData = useMemo((): DrilldownSegment[] => {
  if (drilldownPath.length === 0) {
    // Return aggregated top-level data
    return customerData.map((data) => ({
      id: data.customer,
      label: data.customer,
      value: data.total,
      color: data.color,
    }));
  } else if (drilldownPath.length === 1) {
    // Return filtered second-level data
    const customer = customerData.find((c) => c.customer === drilldownPath[0]);
    return customer?.orders.map((order) => ({...})) || [];
  } else if (drilldownPath.length === 2) {
    // Return deepest level details
    return [...];
  }
  return [];
}, [drilldownPath, customerData]);
```

---

**Animation Pattern (In-Place Transitions):**

```tsx
// ✅ CORRECT - AnimatePresence with keyed motion.div
<AnimatePresence mode="wait">
  <motion.div
    key={breadcrumbs.join("-")}  // ← Key changes trigger exit/enter
    initial={{ opacity: 0, rotateY: -15, z: -100 }}
    animate={{ opacity: 1, rotateY: 0, z: 0 }}
    exit={{ opacity: 0, rotateY: 15, z: -100 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    {/* Chart content */}
  </motion.div>
</AnimatePresence>

// ❌ WRONG - No AnimatePresence, abrupt transitions
<div>
  {/* Chart content swaps instantly */}
</div>
```

**How it works:**

1. When `breadcrumbs` changes, the `key` changes
2. Old chart animates **out** with `exit` properties
3. New chart animates **in** with `initial` → `animate`
4. The container (`<Card>`) stays in place—only inner content transitions

**Recommended animations by chart type:**

| Chart Type | Initial                    | Exit                      | Notes                |
| ---------- | -------------------------- | ------------------------- | -------------------- |
| 3D Bar     | `rotateY: -15, z: -100`    | `rotateY: 15, z: -100`    | Perspective rotation |
| Donut      | `scale: 0.8, rotateY: -45` | `scale: 0.8, rotateY: 45` | Flip effect          |
| Treemap    | `rotateX: -15, z: -100`    | `rotateX: 15, z: -100`    | Tilt forward/back    |

---

**Breadcrumb Navigation:**

```tsx
// ✅ CORRECT - Breadcrumb with Home button
{
  breadcrumbs.length > 0 && (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onBreadcrumbClick?.(0)}
        className="h-7 px-2"
      >
        <Home className="size-3" />
      </Button>
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="size-3 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBreadcrumbClick?.(index + 1)}
            className="h-7 px-2"
          >
            {crumb}
          </Button>
        </div>
      ))}
    </div>
  )
}

// Handler slices the path
const handleBreadcrumbClick = (index: number) => {
  if (index === 0) setDrilldownPath([])
  else setDrilldownPath(drilldownPath.slice(0, index))
}
```

---

**Shared Interface Standard:**

All drill-down visualizations MUST use this prop interface:

```tsx
interface DrilldownChartProps {
  data: DrilldownSegment[] // What to display
  title: string // Dynamic title
  onSegmentClick?: (segment) => void // Drill action (undefined = no more drilling)
  breadcrumbs?: string[] // Navigation path
  onBreadcrumbClick?: (index) => void // Go back
  valueFormatter?: (value) => string // Format numbers
}

interface DrilldownSegment {
  id: string // Unique identifier
  label: string // Display name
  value: number // Numeric value
  color: string // Hex color
  sublabel?: string // Optional secondary text
}
```

This makes visualizations **composable** and **swappable**—any data source can use any visualization.

---

**Click Handler Pattern:**

```tsx
// ✅ CORRECT - Disable click at deepest level
const handleSegmentClick = (segment: DrilldownSegment) => {
  if (drilldownPath.length < 2) {
    // Max 2 levels deep
    setDrilldownPath([...drilldownPath, segment.id])
  }
  // At deepest level, no action
}

// Pass undefined to disable interaction
;<DrilldownChart3D
  data={currentData}
  onSegmentClick={drilldownPath.length < 2 ? handleSegmentClick : undefined}
/>
```

---

**Dynamic Title Pattern:**

```tsx
const getTitle = () => {
  if (drilldownPath.length === 0) return 'Customer Workload Analysis'
  if (drilldownPath.length === 1) return `Orders for ${drilldownPath[0]}`
  if (drilldownPath.length === 2) return `Order Details: ${drilldownPath[1]}`
  return 'Analysis'
}

;<DrilldownChart3D title={getTitle()} />
```

---

**Hover State Synchronization:**

For charts with legends, synchronize hover between chart and legend:

```tsx
const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

// In chart segment
<motion.path
  onMouseEnter={() => setHoveredSegment(segment.id)}
  onMouseLeave={() => setHoveredSegment(null)}
  animate={{ scale: hoveredSegment === segment.id ? 1.08 : 1 }}
/>

// In legend item
<div
  className={hoveredSegment === segment.id ? "bg-muted" : ""}
  onMouseEnter={() => setHoveredSegment(segment.id)}
  onMouseLeave={() => setHoveredSegment(null)}
/>
```

---

### Buttons

**Size Standards:**

```tsx
// Large - Primary actions (Add PO, Save)
<Button className="h-14 px-8 text-base font-semibold rounded-full">
  Large Button (56px height)
</Button>

// Medium - Secondary actions (Cancel, Edit)
<Button className="h-11 px-6 text-sm font-medium rounded-lg">
  Medium Button (44px height)
</Button>

// Small - Inline actions (Remove, Clear)
<Button className="h-8 px-3 text-xs font-medium rounded-md">
  Small Button (32px height)
</Button>
```

**Color Standards:**

| Variant             | Light Mode                                   | Dark Mode | Use Case               |
| ------------------- | -------------------------------------------- | --------- | ---------------------- |
| `default` (primary) | `bg-primary text-primary-foreground`         | Same      | Primary CTAs           |
| `secondary`         | `bg-secondary text-secondary-foreground`     | Same      | Secondary actions      |
| `outline`           | `border border-border bg-card`               | Same      | Tertiary actions       |
| `ghost`             | `hover:bg-muted`                             | Same      | Less important actions |
| `destructive`       | `bg-destructive text-destructive-foreground` | Same      | Delete, cancel         |

**Visibility Rules:**

- **Contrast Ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Visible**: Always show `ring-2 ring-ring ring-offset-2`
- **Hover State**: Always have `hover:scale-105` or color shift
- **Disabled State**: `opacity-50 cursor-not-allowed`

**Icon Buttons:**

```tsx
// ✅ CORRECT - Minimum touch target
<button className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
  <Icon className="h-5 w-5" />
</button>

// ❌ WRONG - Too small to tap
<button className="h-6 w-6">
  <Icon className="h-3 w-3" />
</button>
```

---

### Typography

**Font Families:**

- **Headings**: `'Space Grotesk', sans-serif` (display font)
- **Body**: `'Inter', sans-serif` (readable)
- **Monospace**: `'ui-monospace', 'SFMono-Regular', monospace` (data, codes)

**Size Scale:**

```tsx
text-xs      // 12px - Labels, captions, metadata
text-sm      // 14px - Secondary text, descriptions
text-base    // 16px - Body text, default
text-lg      // 18px - Emphasized body text
text-xl      // 20px - Modal titles, section headers
text-2xl     // 24px - Page headers
text-3xl     // 30px - Hero titles
```

**Weight Scale:**

```tsx
font - normal // 400 - Body text
font - medium // 500 - Emphasized text, buttons
font - semibold // 600 - Headers, important text
font - bold // 700 - Strong emphasis
```

**Header Hierarchy:**

```tsx
// Page Header (Dashboard, Kanban, Scheduling)
<h1 className="text-3xl font-bold tracking-tight text-foreground">
  Page Title
</h1>

// Modal Title
<h2 className="text-xl font-semibold text-foreground">
  Modal Title
</h2>

// Section Header
<h3 className="text-lg font-semibold text-foreground">
  Section Title
</h3>

// Subsection
<h4 className="text-base font-medium text-foreground">
  Subsection Title
</h4>
```

---

### Spacing System

**4px Base Unit Scale:**

```tsx
p - 2 // 8px   - Tight spacing (button padding)
p - 3 // 12px  - Compact spacing
p - 4 // 16px  - Default spacing (cards, modal padding)
p - 6 // 24px  - Comfortable spacing (sections)
p - 8 // 32px  - Generous spacing (major sections)
```

**Gap Between Elements:**

```tsx
gap - 2 // 8px  - Related items (button + icon)
gap - 3 // 12px - Form fields
gap - 4 // 16px - Card children, list items
gap - 6 // 24px - Section separation
gap - 8 // 32px - Major sections
```

---

### Scrollbars

**Custom Scrollbar Styles:**

```css
/* Add to index.css */

/* Webkit browsers (Chrome, Safari, Edge) */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: hsl(var(--scroll-track));
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--scroll-thumb));
  border-radius: 4px;
  transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--scroll-thumb-hover));
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--scroll-thumb)) hsl(var(--scroll-track));
}
```

**Usage:**

```tsx
<div className="overflow-y-auto custom-scrollbar">{/* Long content */}</div>
```

---

### Icons

**Size Standards:**

```tsx
<Icon className="h-3 w-3" />  // 12px - Tiny (inline with text-xs)
<Icon className="h-4 w-4" />  // 16px - Small (inline with text-sm)
<Icon className="h-5 w-5" />  // 20px - Default (buttons, list items)
<Icon className="h-6 w-6" />  // 24px - Medium (section headers)
<Icon className="h-8 w-8" />  // 32px - Large (hero, featured)
```

**Color Standards:**

```tsx
// Primary
<Icon className="text-primary" />

// Muted (less important)
<Icon className="text-muted-foreground" />

// Destructive (delete, warning)
<Icon className="text-destructive" />

// Inherit from text
<Icon className="text-foreground" />
```

---

## 🎨 Color Palette (Reference)

### Current Dark Mode Colors (from index.css)

```css
--primary: 185 100% 60%; /* Cyan */
--secondary: 222 18% 18%; /* Dark slate */
--accent: 28 100% 56%; /* Orange */
--destructive: 0 84% 62%; /* Red */
--muted: 222 18% 15%; /* Very dark slate */
--muted-foreground: 220 11% 65%; /* Gray */
--border: 223 17% 20%; /* Subtle border */
--card: 220 16% 10%; /* Card background */
--foreground: 210 20% 94%; /* Primary text */
```

### Stage Colors

| Stage             | Gradient                          | Border    |
| ----------------- | --------------------------------- | --------- |
| QUEUE             | `from-slate-600 to-slate-400`     | `slate`   |
| FABRICATION       | `from-blue-600 to-blue-400`       | `cyan`    |
| STAGED_FOR_POWDER | `from-cyan-600 to-cyan-400`       | `cyan`    |
| POWDER_COAT       | `from-purple-600 to-purple-400`   | `purple`  |
| ASSEMBLY          | `from-amber-600 to-amber-400`     | `amber`   |
| SHIP              | `from-emerald-600 to-emerald-400` | `emerald` |
| CLOSED            | `from-green-600 to-green-400`     | `green`   |

---

## ✅ Component Checklist

Before marking a component "done", verify:

- [ ] Modal fits on screen with max-height
- [ ] Modal content scrolls when needed
- [ ] All buttons have min-height of 44px
- [ ] All buttons are readable in light/dark mode
- [ ] Header hierarchy is clear (h1 > h2 > h3 > h4)
- [ ] Text contrast meets WCAG AA standards
- [ ] Touch targets are at least 44×44px
- [ ] Scrollbars are styled and visible
- [ ] Icons use correct size for context
- [ ] Spacing follows 4px grid
- [ ] Drill-down charts use path-based state (`useState<string[]>`)
- [ ] Drill-down charts have AnimatePresence with keyed motion.div
- [ ] Drill-down breadcrumbs include Home button
- [ ] Drill-down visualizations follow shared interface standard

---

## 🐛 Common Issues & Fixes

### Issue: Charts rendering in black/no color

**Problem**: SVG charts appear black instead of showing their intended colors.

**Root Cause**: Several opacity and shadow issues compound to darken the chart:

1. Gradient fills with bottom opacity too low (70-80%)
2. Shadow opacity too high (30%)
3. Shadow filter slope too aggressive (0.3-0.4)
4. 3D edge highlights too strong (60% opacity)

**Solution**:

```tsx
// ❌ WRONG - Too many shadows and gradients
<linearGradient id="gradient">
  <stop offset="0%" stopColor={color} stopOpacity="1" />
  <stop offset="100%" stopColor={color} stopOpacity="0.7" />  {/* Too transparent */}
</linearGradient>

<filter id="shadow">
  <feFuncA type="linear" slope="0.3" />  {/* Too dark */}
</filter>

<motion.rect fill={color} opacity="0.3" />  {/* Shadow too dark */}
<motion.rect fill={color} opacity="0.6" height="6" />  {/* Edge highlight too strong */}

// ✅ CORRECT - Solid colors with reduced shadows
<motion.path
  fill={segment.color}
  fillOpacity="0.9"  {/* Solid color at 90% opacity */}
  stroke="white"
  strokeWidth="2"
/>

<filter id="shadow">
  <feFuncA type="linear" slope="0.2" />  {/* Reduced from 0.3 to 0.2 */}
</filter>

<motion.rect
  fill={segment.color}
  opacity="0.15"  {/* Reduced from 0.3 to 0.15 */}
/>
<motion.rect
  fill={segment.color}
  opacity="0.4"  {/* Reduced from 0.6 to 0.4 */}
  height="8"  {/* Increased from 6 to 8 */}
/>
```

**Key Changes**:

1. **Replace gradients with solid colors**: Use `fill={color}` with `fillOpacity="0.9"` instead of gradient fills
2. **Reduce shadow opacity**: Change from 30% (0.3) to 15% (0.15)
3. **Adjust shadow filter**: Change slope from 0.3-0.4 to 0.2
4. **Soften 3D edge highlights**: Reduce opacity from 60% (0.6) to 40% (0.4) and increase height from 6px to 8px

**Applies to**: All SVG-based charts including donut charts, treemaps, and custom visualizations.

---

### Issue: Modal content gets cut off

```tsx
// ❌ WRONG
<div className="w-full rounded-3xl">
  {/* Too much content, no scroll */}
</div>

// ✅ CORRECT
<div className="max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-3xl">
  <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
    {/* Scrollable content */}
  </div>
</div>
```

### Issue: Button too small on mobile

```tsx
// ❌ WRONG
<button className="h-8 px-2">Tap me</button>

// ✅ CORRECT
<button className="h-11 min-w-[44px] px-4">Tap me</button>
```

### Issue: Text hard to read in dark mode

```tsx
// ❌ WRONG
<h2 className="text-gray-400">Header</h2>

// ✅ CORRECT
<h2 className="text-foreground">Header</h2>
```

---

## 📝 How to Use This Document

1. **Before building**: Review the relevant section
2. **While building**: Follow the code examples
3. **After building**: Run through the checklist
4. **When you find a new pattern**: Add it to this document

---

**Next Steps:**

1. Share screenshots of UI issues
2. We'll audit and create specific fixes
3. Update this document as we establish new patterns
