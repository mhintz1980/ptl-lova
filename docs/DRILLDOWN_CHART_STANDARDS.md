# Dashboard Drill-Down Chart Standards

> **CRITICAL**: Read this document BEFORE creating or modifying any dashboard charts with drill-down functionality.

## Overview

This document defines the standards for implementing drill-down charts in the PumpTracker dashboard. These patterns ensure consistent UX, zero layout shift, and smooth transitions.

---

## Core Principles

1. **Zero Layout Shift**: Container heights must be fixed to prevent jarring layout changes
2. **Smooth Transitions**: Use `AnimatePresence mode="wait"` for fade transitions (0.2s)
3. **Responsive Sizing**: Charts must adapt to their container, not use fixed pixel widths
4. **Clear Navigation**: Breadcrumbs must always be visible in drill-down views
5. **Consistent Patterns**: All drill-down charts follow the same interaction model

---

## Required Pattern: AnimatePresence

**ALWAYS** wrap drill-down view transitions with `AnimatePresence`:

```tsx
import { AnimatePresence } from 'motion/react'

<AnimatePresence mode="wait">
  {!isDrilledDown ? (
    <motion.div key="main" /* main view */>
  ) : (
    <motion.div key="drilldown" /* drill-down view */>
  )}
</AnimatePresence>
```

**Key Properties**:

- `mode="wait"`: Waits for exit animation before showing new view
- `key` prop: Must be unique for each view state
- `transition={{ duration: 0.2 }}`: Standard transition speed

---

## Required Pattern: Fixed Heights

**Container Heights Must Be Fixed** to prevent layout shift:

```tsx
// ✅ CORRECT
<CardContent className="h-[400px] w-full px-0 pb-0 relative overflow-hidden">

// ❌ WRONG - causes layout jumping
<CardContent className="w-full px-0 pb-0">
```

**Standard Heights**:

- **Trend/Sparkline Charts**: `h-[400px]` (container + chart height)
- **Donut Charts**: `h-[450px]`
- **3D Bar Charts (DrilldownChart3D)**: Individual bars = `h-12` (48px)

---

## Required Pattern: Responsive Chart Sizing

Charts must size to their container, **not use fixed pixel widths**.

### ❌ WRONG - Fixed Width

```tsx
const width = 400 // BAD: causes undersizing and mouse offset
```

### ✅ CORRECT - Responsive Width

```tsx
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
```

---

## Component Structure

### Level 0: Main Chart (e.g., TotalValueTrendChart)

```tsx
export function MyDrilldownChart({ filters }: ChartProps) {
  const { pumps } = useApp()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Level 0: Main data
  const mainData = useMemo(() => {
    // Aggregate data for main view
    return /* ... */
  }, [pumps, filters])

  // Level 1: Drill-down data
  const drilldownData = useMemo((): DrilldownSegment[] => {
    if (!selectedItem) return []
    // Break down selected item
    return /* ... */
  }, [pumps, selectedItem])

  return (
    <Card className="h-full border-none shadow-none bg-transparent flex flex-col overflow-hidden">
      <CardHeader className="px-0 pt-0 pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
          <span>
            {selectedItem ? `Breakdown: ${selectedItem}` : 'Main View'}
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
              <MyChart
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
```

---

## Visual Standards

### Selection Indicators

**Active Dots/Points Must Be Visible**:

```tsx
// ✅ CORRECT - colored dot
activeDot={{
  r: 6,
  strokeWidth: 2,
  fill: color,        // Use chart color
  stroke: '#fff',     // White outline
}}

// ❌ WRONG - invisible on light backgrounds
activeDot={{
  fill: '#fff',       // BAD: same as background
}}
```

### Hover Effects

```tsx
// Vertical tracking line
{
  nearestPoint && (
    <motion.line
      x1={nearestPoint.x}
      y1={chartTop}
      x2={nearestPoint.x}
      y2={chartBottom}
      stroke={color}
      strokeWidth="1"
      strokeDasharray="4 4"
      opacity="0.5"
    />
  )
}
```

---

## Breadcrumb Navigation

**Always provide clear navigation back**:

```tsx
<DrilldownChart3D
  breadcrumbs={[selectedWeek]}
  onBreadcrumbClick={() => setSelectedWeek(null)}
  // ...
/>
```

DrilldownChart3D automatically renders:

- Home icon button
- Breadcrumb trail
- Click handlers to return to main view

---

## Common Mistakes to Avoid

### ❌ Don't: Use Percentage Heights

```tsx
<div className="h-full"> // Expands to parent, causes layout shift
```

### ❌ Don't: Hardcode Chart Widths

```tsx
const width = 400 // Causes undersizing on larger screens
```

### ❌ Don't: Use White/Transparent for Interactive Elements

```tsx
fill: '#fff' // Invisible on light backgrounds
fill: 'transparent' // User can't see what to click
```

### ❌ Don't: Forget AnimatePresence mode="wait"

```tsx
<AnimatePresence> // Views overlap during transition
```

### ❌ Don't: Use Different Transition Speeds

```tsx
transition={{ duration: 0.5 }} // Inconsistent with 0.2s standard
```

---

## Testing Checklist

Before committing drill-down chart changes:

- [ ] Container has **fixed height** (`h-[400px]` or similar)
- [ ] Chart sizing is **responsive** (uses container width)
- [ ] `AnimatePresence mode="wait"` wraps view transitions
- [ ] Transition duration is **0.2s**
- [ ] Selection indicators are **clearly visible**
- [ ] Breadcrumb navigation **returns to main view**
- [ ] **No layout jumping** occurs during transitions
- [ ] Works correctly on **different screen sizes**
- [ ] TypeScript build passes with **no errors**
- [ ] Tested in browser - **all interactions work**

---

## Reference Implementation

**Best Examples**:

- `TotalValueTrendChart.tsx` - Sparkline → Customer breakdown
- `ThroughputTrendChart.tsx` - Area chart → Model breakdown
- `CyclingDonutChart.tsx` - Auto-pause + drill-down

**Reusable Components**:

- `DrilldownChart3D.tsx` - 3D horizontal bar chart for drill-downs
- `SparklineAreaChart.tsx` - Responsive sparkline with click handling
- `TrendAreaChart.tsx` - Area chart with visible selection dots

---

## Questions?

If implementing a new drill-down pattern not covered here:

1. Review the reference implementations above
2. Follow the core principles (zero layout shift, smooth transitions, responsive)
3. Test thoroughly before committing
4. Update this document with new patterns discovered

---

**Last Updated**: 2026-01-01  
**Version**: 1.0
