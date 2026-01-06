# Dashboard Drill-Down Chart Implementation Guide

**Version**: 1.0
**Last Updated**: 2025-12-27
**Purpose**: Complete guide for implementing drill-down charts correctly on the first try

---

## 🎯 Overview

This guide provides everything needed to implement drill-down dashboard charts without iteration. Follow these patterns exactly to avoid TypeScript errors, scroll jumping issues, and page load failures.

---

## 📋 Prerequisites Checklist

Before implementing ANY drill-down chart, verify you have:

- [ ] Read `docs/DESIGN_SYSTEM.md` → "Drill-Down Charts" section
- [ ] Read `docs/plans/dashboard_drilldown_implementation.md` for specific chart requirements
- [ ] Reviewed reference implementation: `WorkloadDonutChart.tsx`
- [ ] Understand Pump interface properties (especially `last_update`)
- [ ] Know which visualization to use (DrilldownChart3D, DrilldownDonutChart, or DrilldownTreemapChart)

---

## 🚀 Quick Start Template

### Basic Drill-Down Chart (One Level)

Use this template for simple one-level drill-downs:

```tsx
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'

export function MyDrilldownChart(_props: ChartProps) {
  const { pumps } = useApp()
  const [drilldownPath, setDrilldownPath] = useState<string[]>([])

  // Level 0: Aggregate data for top-level view
  const topLevelData = useMemo((): DonutSegment[] => {
    // Group and aggregate pump data
    const groupMap = new Map<string, number>()
    pumps.forEach((pump) => {
      const key = pump.someProperty // e.g., customer, stage, model
      groupMap.set(key, (groupMap.get(key) || 0) + 1)
    })

    return Array.from(groupMap.entries()).map(([key, value]) => ({
      id: key,
      label: key,
      value,
      color: getColorFor(key),
    }))
  }, [pumps])

  // Level 1: Detailed breakdown for selected item
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (drilldownPath.length === 0) return []

    const selectedId = drilldownPath[0]
    const filteredPumps = pumps.filter((p) => p.someProperty === selectedId)

    // Group filtered pumps by another dimension
    const customerMap = new Map<string, { count: number; totalAge: number }>()
    filteredPumps.forEach((pump) => {
      if (!customerMap.has(pump.customer)) {
        customerMap.set(pump.customer, { count: 0, totalAge: 0 })
      }
      const data = customerMap.get(pump.customer)!
      data.count += 1

      // Calculate age using last_update (CRITICAL!)
      if (pump.last_update) {
        const ageInMs = Date.now() - new Date(pump.last_update).getTime()
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
        data.totalAge += ageInDays
      }
    })

    return Array.from(customerMap.entries())
      .map(([customer, data]) => ({
        id: customer,
        label: customer,
        value: data.count,
        color: getColorFor(selectedId),
        sublabel: `Avg: ${
          data.count > 0 ? (data.totalAge / data.count).toFixed(1) : 0
        } days`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [drilldownPath, pumps])

  const handleSegmentClick = (segment: DonutSegment | DrilldownSegment) => {
    if (drilldownPath.length === 0) {
      setDrilldownPath([segment.id])
    }
    // No action at deepest level
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([])
    }
  }

  const getTitle = () => {
    if (drilldownPath.length === 0) return 'My Chart Title'
    return `Details for ${drilldownPath[0]}`
  }

  return (
    <div className="w-full h-full flex flex-col min-h-[300px]">
      <AnimatePresence mode="wait">
        {drilldownPath.length === 0 ? (
          <motion.div
            key="donut"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <DrilldownDonutChart
              data={topLevelData}
              title={getTitle()}
              onSegmentClick={handleSegmentClick}
              valueFormatter={(v) => `${v} items`}
            />
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
            <DrilldownChart3D
              data={drilldownData}
              title={getTitle()}
              breadcrumbs={[drilldownPath[0]]}
              onBreadcrumbClick={handleBreadcrumbClick}
              valueFormatter={(v) => `${v} items`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getColorFor(key: string): string {
  // Return color based on key
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  const index = Math.abs(hashCode(key)) % colors.length
  return colors[index]
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
```

---

## ⚠️ Critical Implementation Rules

### 1. Pump Interface Usage

```tsx
// ✅ CORRECT - Use last_update for time calculations
import { Pump } from '../../../types'

pump.last_update // ISO timestamp string - USE THIS
pump.value // Numeric value
pump.customer // String
pump.model // String
pump.stage // Stage enum
pump.priority // Priority enum
pump.po // String
pump.serial // number | null

// ❌ WRONG - These properties DO NOT exist
pump.stageEntryTime // ❌ Does NOT exist
pump.createdAt // ❌ Does NOT exist
pump.entryTime // ❌ Does NOT exist
```

### 2. Required Imports

```tsx
// ✅ CORRECT - All imports present
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react' // ← CRITICAL!
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
import { DrilldownDonutChart, DonutSegment } from './DrilldownDonutChart'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'

// ❌ WRONG - Missing AnimatePresence
import { useState, useMemo } from 'react'
import { DrilldownChart3D } from './DrilldownChart3D'
// Missing: AnimatePresence import → Runtime failure!
```

### 3. Age Calculation Pattern

```tsx
// ✅ CORRECT - Calculate age in days
const ageInMs = Date.now() - new Date(pump.last_update).getTime()
const ageInDays = ageInMs / (1000 * 60 * 60 * 24)

// For grouping:
const customerMap = new Map<string, { count: number; totalAge: number }>()
pumps.forEach((pump) => {
  if (!customerMap.has(pump.customer)) {
    customerMap.set(pump.customer, { count: 0, totalAge: 0 })
  }
  const data = customerMap.get(pump.customer)!
  data.count += 1

  if (pump.last_update) {
    // ← Check for existence
    const ageInMs = Date.now() - new Date(pump.last_update).getTime()
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
    data.totalAge += ageInDays
  }
})

// Display average:
sublabel: `Avg: ${(data.totalAge / data.count).toFixed(1)} days`

// ❌ WRONG - Using non-existent properties
const ageInMs =
  Date.now() - new Date(pump.stageEntryTime || pump.createdAt).getTime()
// TypeScript error: Property 'stageEntryTime' does not exist
```

### 4. TypeScript Props Handling

```tsx
// ✅ CORRECT - Prefix unused props with underscore
export function MyChart({ onDrilldown: _onDrilldown }: ChartProps) {
  // _onDrilldown indicates intentionally unused
}

// OR
export function MyChart(_props: ChartProps) {
  // All props intentionally unused
}

// ❌ WRONG - Unused prop causes TypeScript error
export function MyChart({ onDrilldown }: ChartProps) {
  // Error: 'onDrilldown' is declared but its value is never read
}
```

### 5. Zero Layout Shift (Fixed Height Pattern)

To prevents page jumping on drill-down, you **MUST** use a fixed height container with internal scrolling. relying on `min-h` is insufficient as drill-down lists can expand and push page content.

```tsx
// ✅ CORRECT - Zero Layout Shift Pattern
return (
  // 1. Fixed height (e.g., h-[450px])
  // 2. Relative positioning for AnimatePresence
  // 3. Overflow hidden to contain animations
  <div className="w-full h-[450px] flex flex-col relative overflow-hidden">
    <AnimatePresence mode="wait">
      {drilldownPath.length === 0 ? (
        <motion.div
          key="donut"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <DrilldownDonutChart {...props} />
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
          {/* Inner chart MUST handle scrolling if content overflows */}
          <DrilldownChart3D
            className="flex flex-col overflow-y-auto" // Enable internal scroll
            {...props}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

// ❌ WRONG - Causes page to jump
return (
  <div className="min-h-[300px]">
    {' '}
    {/* ❌ Allows expansion -> Layout Shift */}
    {drilldownPath.length === 0 ? (
      <DrilldownDonutChart />
    ) : (
      <DrilldownChart3D />
    )}
  </div>
)
```

**Why this matters:**

- `min-h-[300px]` prevents container collapse during transition
- Opacity-only transitions prevent layout shifts
- `w-full h-full` ensures views fill container
- `AnimatePresence mode="wait"` ensures smooth exit/enter

---

## 🎨 Visualization Selection Guide

### DrilldownDonutChart

**Use for:** Top-level aggregated data with clear segments

```tsx
<DrilldownDonutChart
  data={donutSegments}
  title="Workload by Customer"
  onSegmentClick={handleSegmentClick}
  valueFormatter={(v) => `${v} pumps`}
/>
```

**Best for:**

- Customer distribution
- Stage distribution
- Model distribution
- Any part-to-whole relationship

**DonutSegment interface:**

```tsx
interface DonutSegment {
  id: string // Unique identifier
  label: string // Display name
  value: number // Numeric value
  color: string // Hex color
  sublabel?: string // Optional secondary text
}
```

### DrilldownChart3D

**Use for:** Detailed breakdowns with horizontal bars

```tsx
<DrilldownChart3D
  data={drilldownSegments}
  title="Pumps in Stage"
  breadcrumbs={['FABRICATION']}
  onBreadcrumbClick={handleBreadcrumbClick}
  valueFormatter={(v) => `${v} pumps`}
/>
```

**Best for:**

- Drill-down level details
- Ranked items (customers, POs, models)
- Comparisons with sublabels
- Any time-based or numeric data

**DrilldownSegment interface:**

```tsx
interface DrilldownSegment {
  id: string // Unique identifier
  label: string // Display name
  value: number // Numeric value
  color: string // Hex color
  sublabel?: string // Optional secondary text (e.g., "Avg: 5.2 days")
}
```

### DrilldownTreemapChart

**Use for:** Hierarchical data with size encoding

```tsx
<DrilldownTreemapChart
  data={treemapSegments}
  title="Value by Customer"
  onSegmentClick={handleSegmentClick}
  valueFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
/>
```

**Best for:**

- Value data (monetary)
- Size comparisons
- Hierarchical drilling

**TreemapSegment interface:**

```tsx
interface TreemapSegment {
  id: string // Unique identifier
  label: string // Display name
  value: number // Numeric value (determines size)
  color: string // Hex color
}
```

---

## 📊 Common Data Grouping Patterns

### Pattern 1: Group by Customer

```tsx
const customerMap = new Map<string, { count: number; totalValue: number }>()
pumps.forEach((pump) => {
  if (!customerMap.has(pump.customer)) {
    customerMap.set(pump.customer, { count: 0, totalValue: 0 })
  }
  const data = customerMap.get(pump.customer)!
  data.count += 1
  data.totalValue += pump.value || 0
})

return Array.from(customerMap.entries()).map(([customer, data]) => ({
  id: customer,
  label: customer,
  value: data.count,
  sublabel: formatCurrency(data.totalValue),
}))
```

### Pattern 2: Group by Stage

```tsx
const stageMap = new Map<Stage, number>()
pumps.forEach((pump) => {
  if (pump.stage !== 'CLOSED') {
    stageMap.set(pump.stage, (stageMap.get(pump.stage) || 0) + 1)
  }
})

return Array.from(stageMap.entries()).map(([stage, count]) => ({
  id: stage,
  label: stage.replace(/_/g, ' '),
  value: count,
  color: getStageColor(stage),
}))
```

### Pattern 3: Group by Model

```tsx
const modelMap = new Map<string, Pump[]>()
pumps.forEach((pump) => {
  if (!modelMap.has(pump.model)) {
    modelMap.set(pump.model, [])
  }
  modelMap.get(pump.model)!.push(pump)
})

return Array.from(modelMap.entries()).map(([model, modelPumps]) => ({
  id: model,
  label: model,
  value: modelPumps.length,
  sublabel: `${modelPumps.length} pumps`,
}))
```

### Pattern 4: Group by Customer with Age Calculation

```tsx
const customerMap = new Map<string, { count: number; totalAge: number }>()
pumps.forEach((pump) => {
  if (!customerMap.has(pump.customer)) {
    customerMap.set(pump.customer, { count: 0, totalAge: 0 })
  }
  const data = customerMap.get(pump.customer)!
  data.count += 1

  if (pump.last_update) {
    const ageInMs = Date.now() - new Date(pump.last_update).getTime()
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
    data.totalAge += ageInDays
  }
})

return Array.from(customerMap.entries())
  .map(([customer, data]) => ({
    id: customer,
    label: customer,
    value: data.count,
    sublabel: `Avg: ${
      data.count > 0 ? (data.totalAge / data.count).toFixed(1) : 0
    } days`,
  }))
  .sort((a, b) => b.value - a.value)
```

---

## 🎨 Color Assignment Patterns

### Consistent Hash-Based Colors

```tsx
function getColorFor(key: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
  ]
  const index = Math.abs(hashCode(key)) % colors.length
  return colors[index]
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
```

### Stage-Specific Colors

```tsx
function getStageColor(stage: string): string {
  switch (stage) {
    case 'QUEUE':
      return '#94a3b8' // Slate
    case 'FABRICATION':
      return '#06b6d4' // Cyan
    case 'STAGED_FOR_POWDER':
      return '#a855f7' // Purple
    case 'POWDER_COAT':
      return '#f97316' // Orange
    case 'ASSEMBLY':
      return '#22c55e' // Green
    case 'SHIP':
      return '#3b82f6' // Blue
    default:
      return '#64748b'
  }
}
```

---

## 🔍 Debugging Checklist

If a drill-down chart doesn't work:

### TypeScript Compilation Errors

- [ ] Check all imports include `motion, AnimatePresence` from 'motion/react'
- [ ] Verify no usage of `pump.stageEntryTime` or `pump.createdAt`
- [ ] Prefix unused props with underscore: `_props` or `{ onDrilldown: _onDrilldown }`
- [ ] Ensure `DrilldownSegment` or `DonutSegment` interfaces are imported

### Runtime Errors (Page Won't Load)

- [ ] Verify `AnimatePresence` is imported
- [ ] Check that `motion` is imported from 'motion/react'
- [ ] Ensure all charts have proper data (not undefined)

### Page Jumps on Drill-Down

- [ ] Add outer container with `min-h-[300px]`
- [ ] Use opacity-only transitions (no scale/rotate)
- [ ] Ensure `w-full h-full` on motion.div elements
- [ ] Check `AnimatePresence mode="wait"`

### Data Not Showing

- [ ] Verify `useMemo` dependencies include all used variables
- [ ] Check that filtered data is not empty array
- [ ] Ensure segment interfaces have required fields (id, label, value, color)
- [ ] Add console.log to debug data transformations

### Wrong Colors

- [ ] Verify color function returns valid hex strings
- [ ] Check color prop is passed to segment objects
- [ ] Ensure z-index is correct (layer-l1 with !bg-card !relative)

---

## ✅ Final Verification

Before marking a drill-down chart complete:

1. **TypeScript**: `pnpm run build` completes with no errors in your chart file
2. **Runtime**: Chart loads without console errors
3. **Drill-Down**: Clicking segment transitions to detailed view
4. **Scroll**: Page does NOT jump when drilling down
5. **Breadcrumb**: Home button returns to top-level view
6. **Data**: Correct pumps shown at each level
7. **Empty State**: Handles case with no data gracefully
8. **Responsiveness**: Works on mobile and desktop

---

## 📚 Related Documentation

- `docs/DESIGN_SYSTEM.md` → Complete design system standards
- `docs/plans/dashboard_drilldown_implementation.md` → Specific upgrade plans
- `src/components/dashboard/charts/WorkloadDonutChart.tsx` → Reference implementation
- `src/types.ts` → Pump interface definition

---

## 🚀 Implementation Workflow

1. **Read this guide** - Understand the patterns
2. **Read the plan** - Know what to build
3. **Copy the template** - Start with working code
4. **Adapt data logic** - Change grouping/aggregation
5. **Test compilation** - `pnpm run build`
6. **Test runtime** - Dev server + manual click testing
7. **Verify checklist** - All items pass

**Expected Time**: 30-45 minutes per chart (after learning curve)

---

**Last Updated**: 2025-12-27
**Maintained By**: Development Team
