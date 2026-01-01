# Dashboard Drill-Down Chart Standards & Implementation Guide

> **CRITICAL**: This is the ONLY authoritative guide for creating drill-down charts. Read this BEFORE implementing ANY dashboard chart.

**Version**: 2.0 (Consolidated)  
**Last Updated**: 2026-01-01  
**Replaces**: `docs/concepts/Dashboard for PumpTracker App/README.md`

---

## 🎯 Quick Reference

**Working Examples** (use as templates):

- `src/components/dashboard/charts/TotalValueTrendChart.tsx` - Sparkline → Customer breakdown
- `src/components/dashboard/charts/ThroughputTrendChart.tsx` - Area chart → Model breakdown
- `src/components/dashboard/charts/CyclingDonutChart.tsx` - Auto-pause + drill-down

**Reusable Components**:

- `DrilldownChart3D.tsx` - 3D horizontal bars for drill-downs
- `SparklineAreaChart.tsx` - Responsive sparkline
- `TrendAreaChart.tsx` - Area chart with visible selection

---

## 📋 Core Principles (NEVER VIOLATE)

1. **Zero Layout Shift**: Fixed container heights prevent page jumping
2. **Responsive Sizing**: Charts adapt to containers, never use fixed widths
3. **Smooth Transitions**: `AnimatePresence mode="wait"` with 0.2s fade
4. **Clear Navigation**: Breadcrumbs always visible in drill-down
5. **Visible Interactions**: Selection dots/lines must be clearly visible

---

## ⚡ Critical Patterns (Copy These Exactly)

### Pattern 1: Fixed Height Container

**ALWAYS use fixed heights to prevent layout shift:**

```tsx
// ✅ CORRECT
<CardContent className="h-[400px] w-full px-0 pb-0 relative overflow-hidden">

// ❌ WRONG - causes page jumping
<CardContent className="min-h-[400px]"> // Expands, shifts layout
```

**Standard Heights**:

- Trend/Sparkline/Area charts: `h-[400px]`
- Donut charts: `h-[450px]`
- 3D Bar individual bars: `h-12` (48px)

### Pattern 2: Responsive Chart Sizing

**Charts MUST measure their container, NOT use fixed pixel widths:**

```tsx
// ✅ CORRECT - Responsive
const containerRef = useRef<HTMLDivElement>(null)
const [width, setWidth] = useState(400)

useEffect(() => {
  if (!containerRef.current) return

  const updateWidth = () => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth || 400)
    }
  }

  updateWidth()
  const observer = new ResizeObserver(updateWidth)
  observer.observe(containerRef.current)

  return () => observer.disconnect()
}, [])

return (
  <div ref={containerRef} className="w-full h-full">
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >

// ❌ WRONG - Fixed width causes undersizing
const width = 400 // BAD: doesn't scale to container
```

### Pattern 3: AnimatePresence Transitions

**ALWAYS wrap view transitions:**

```tsx
import { AnimatePresence } from 'motion/react'

;<AnimatePresence mode="wait">
  {!isDrilledDown ? (
    <motion.div
      key="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
    >
      {/* Main view */}
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
      {/* Drill-down view */}
    </motion.div>
  )}
</AnimatePresence>
```

**Critical Details**:

- `mode="wait"`: Waits for exit before showing new view
- `key` prop: MUST be unique for each state
- `duration: 0.2`: Standard transition speed (DO NOT change)
- `className="w-full h-full"`: Fills container, prevents shift

### Pattern 4: Visible Selection Indicators

**Selection elements MUST be clearly visible:**

```tsx
// ✅ CORRECT - Colored with white outline
activeDot={{
  r: 6,
  strokeWidth: 2,
  fill: color,        // Use chart's color
  stroke: '#fff',     // White outline for contrast
}}

// ❌ WRONG - Invisible on light backgrounds
activeDot={{
  fill: '#fff',       // Same as background!
  strokeWidth: 0,
}}
```

---

## 🚀 Complete Implementation Template

Use this template for all new drill-down charts:

```tsx
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChartProps } from '../dashboardConfig'
import { useApp } from '../../../store'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card'
import { DrilldownChart3D, DrilldownSegment } from './DrilldownChart3D'
import { YourMainChart } from './YourMainChart'

export function MyDrilldownChart({ filters }: ChartProps) {
  const { pumps } = useApp()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Level 0: Main chart data
  const mainData = useMemo(() => {
    // Filter pumps based on filters
    let filtered = pumps
    if (filters.customerId)
      filtered = filtered.filter((p) => p.customer === filters.customerId)
    if (filters.modelId)
      filtered = filtered.filter((p) => p.model === filters.modelId)
    if (filters.stage)
      filtered = filtered.filter((p) => p.stage === filters.stage)

    // Aggregate data (example: by customer)
    const groupMap = new Map<string, number>()
    filtered.forEach((pump) => {
      const key = pump.customer // or stage, model, etc.
      groupMap.set(key, (groupMap.get(key) || 0) + 1)
    })

    return Array.from(groupMap.entries()).map(([key, value]) => ({
      label: key,
      value,
    }))
  }, [pumps, filters])

  // Level 1: Drill-down data
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (!selectedItem) return []

    // Filter to selected item
    const filtered = pumps.filter((p) => p.customer === selectedItem)

    // Break down by another dimension (example: by model)
    const modelMap = new Map<string, { count: number; totalAge: number }>()
    filtered.forEach((pump) => {
      if (!modelMap.has(pump.model)) {
        modelMap.set(pump.model, { count: 0, totalAge: 0 })
      }
      const data = modelMap.get(pump.model)!
      data.count += 1

      // Calculate age using last_update
      if (pump.last_update) {
        const ageInMs = Date.now() - new Date(pump.last_update).getTime()
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
        data.totalAge += ageInDays
      }
    })

    return Array.from(modelMap.entries())
      .map(([model, data], index) => ({
        id: model,
        label: model,
        value: data.count,
        color: COLORS[index % COLORS.length],
        sublabel: `Avg: ${(data.totalAge / data.count).toFixed(1)} days`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [pumps, selectedItem])

  return (
    <Card className="h-full border-none shadow-none bg-transparent flex flex-col overflow-hidden">
      <CardHeader className="px-0 pt-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>
            {selectedItem ? `Breakdown: ${selectedItem}` : 'Main View Title'}
          </span>
          {!selectedItem && (
            <span className="text-xs font-normal opacity-70">
              Click to drill down
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[400px] w-full px-0 pb-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedItem ? (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <YourMainChart
                data={mainData}
                onItemClick={(item) => setSelectedItem(item)}
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
                title=""
                breadcrumbs={[selectedItem]}
                onBreadcrumbClick={() => setSelectedItem(null)}
                valueFormatter={(v) => `${v} units`}
                className="h-full flex flex-col overflow-y-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#6366f1',
]
```

---

## ⚠️ Pump Interface - Critical Rules

**Use ONLY these properties:**

```tsx
// ✅ CORRECT - These exist
pump.last_update // ISO timestamp - USE FOR TIME CALCULATIONS
pump.value // Numeric value
pump.customer // String
pump.model // String
pump.stage // Stage enum
pump.priority // Priority enum
pump.po // String
pump.serial // number | null
pump.promiseDate // ISO timestamp | null

// ❌ WRONG - These DO NOT exist
pump.stageEntryTime // ❌ Will cause TypeScript error
pump.createdAt // ❌ Will cause TypeScript error
pump.entryTime // ❌ Will cause TypeScript error
```

**Age Calculation Pattern**:

```tsx
// ✅ CORRECT
if (pump.last_update) {
  const ageInMs = Date.now() - new Date(pump.last_update).getTime()
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
}

// ❌ WRONG
const age = pump.stageEntryTime // Property doesn't exist!
```

---

## 📊 Component Selection Guide

### Use DrilldownDonutChart For:

- Top-level aggregated data
- Part-to-whole relationships
- Customer/Stage/Model distribution

```tsx
<DrilldownDonutChart
  data={donutSegments}
  title="Distribution"
  onSegmentClick={handleClick}
  valueFormatter={(v) => `${v} units`}
/>
```

### Use DrilldownChart3D For:

- Drill-down detail views
- Ranked comparisons
- List-style breakdowns

```tsx
<DrilldownChart3D
  data={drilldownSegments}
  breadcrumbs={['Customer A']}
  onBreadcrumbClick={() => setPath([])}
  valueFormatter={(v) => `${v} items`}
/>
```

### Use SparklineAreaChart For:

- Time-series trends
- Weekly/monthly aggregations
- Compact visualizations

```tsx
<SparklineAreaChart
  data={weeklyData}
  color="#06b6d4"
  height={400}
  onPointClick={(point) => setSelected(point.label)}
/>
```

### Use TrendAreaChart For:

- Trend analysis with visible selection
- Interactive time series
- Click-to-drill patterns

```tsx
<TrendAreaChart data={trendData} color="#d946ef" onPointClick={handleClick} />
```

---

## 🎨 Common Data Patterns

### Pattern: Group by Customer with Age

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
    sublabel: `Avg: ${(data.totalAge / data.count).toFixed(1)} days`,
  }))
  .sort((a, b) => b.value - a.value)
```

### Pattern: Group by Stage

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
  color: STAGE_COLORS[stage],
}))
```

---

## 🔍 Common Mistakes (AVOID THESE)

### ❌ Don't: Use min-height for containers

```tsx
<div className="min-h-[400px]"> // Expands → layout shift
```

### ❌ Don't: Hardcode chart widths

```tsx
const width = 400 // Fixed → doesn't scale
```

### ❌ Don't: Use white/transparent for interactive elements

```tsx
fill: '#fff' // Invisible on light backgrounds
```

### ❌ Don't: Forget AnimatePresence mode

```tsx
<AnimatePresence> // Missing mode="wait" → overlap
```

### ❌ Don't: Use different transition speeds

```tsx
transition={{ duration: 0.5 }} // Inconsistent
```

### ❌ Don't: Access non-existent pump properties

```tsx
pump.stageEntryTime // DOES NOT EXIST
```

---

## ✅ Pre-Commit Testing Checklist

Before committing drill-down chart code:

- [ ] **Fixed Height**: Container uses `h-[400px]` or `h-[450px]`
- [ ] **Responsive Width**: Chart measures container, not fixed 400px
- [ ] **AnimatePresence**: Uses `mode="wait"` with 0.2s transition
- [ ] **Visible Selection**: Dots/lines use chart color, not white
- [ ] **No Layout Shift**: Page doesn't jump during transitions
- [ ] **TypeScript Build**: `pnpm build` passes with no errors
- [ ] **Only Valid Props**: Uses `last_update`, not `stageEntryTime`
- [ ] **Breadcrumbs Work**: Can return to main view
- [ ] **Empty State**: Handles no data gracefully
- [ ] **Mobile Tested**: Works on different screen sizes

---

## 📚 Reference Files

**Working Examples** (copy these patterns):

- `src/components/dashboard/charts/TotalValueTrendChart.tsx`
- `src/components/dashboard/charts/ThroughputTrendChart.tsx`
- `src/components/dashboard/charts/CyclingDonutChart.tsx`
- `src/components/dashboard/charts/CycleTimeBreakdownChart.tsx`

**Reusable Components** (use these in your drill-downs):

- `src/components/dashboard/charts/DrilldownChart3D.tsx`
- `src/components/dashboard/charts/DrilldownDonutChart.tsx`
- `src/components/dashboard/charts/SparklineAreaChart.tsx`
- `src/components/dashboard/charts/TrendAreaChart.tsx`

**Type Definitions**:

- `src/types.ts` - Pump interface
- `src/components/dashboard/dashboardConfig.ts` - ChartProps

---

## 🚨 If Something Breaks

### TypeScript Errors

1. Check imports include `AnimatePresence` from `'motion/react'`
2. Verify no usage of `pump.stageEntryTime` or similar
3. Prefix unused props with underscore: `_props`

### Page Won't Load

1. Verify `AnimatePresence` is imported
2. Check data is not undefined
3. Ensure `key` props are unique

### Page Jumps

1. Use fixed height container (`h-[400px]`)
2. Use `AnimatePresence mode="wait"`
3. Ensure `w-full h-full` on motion divs

### Data Not Showing

1. Check `useMemo` dependencies
2. Verify data is not empty array
3. Console.log data transformations

---

**Version**: 2.0 (Consolidated from v1.0 + Dashboard README)  
**Last Updated**: 2026-01-01  
**Maintainer**: Development Team
