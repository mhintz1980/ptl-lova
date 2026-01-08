# Schedule Page v2 Implementation Prompt

> **Paste this entire prompt into a fresh chat to implement the schedule page redesign.**

---

## Context

I need to redesign the Schedule page (`/scheduling`) in PumpTracker Lite. The current implementation has fragmented pill segments with gaps, cluttered text labels, and no visual grouping.

**Project location:** `/home/markimus/projects/ptl-lova`  
**Dev server:** `pnpm dev` runs on `http://localhost:8080`  
**Tech stack:** React + TypeScript + Vite + Tailwind CSS + Zustand

---

## Current Problems

1. **Fragmented Pills**: Each stage is a separate pill with gaps between them (due to business vs calendar day calculation mismatch)
2. **Text Clutter**: Model names, stage abbreviations overlap and become illegible on short pills
3. **No Visual Grouping**: Flat list with no way to quickly find jobs by model/customer without filtering

---

## Requirements

### 1. Unified Pill Shape

Create ONE continuous pill per job spanning from forecast start to forecast end:

- **No gaps** between stages - pill is unbroken
- Internal segments colored by stage (use colors from `STAGE_COLORS` in `src/lib/stage-constants.ts`)
- **Weekend pattern**: Where the job spans Sat/Sun, show a cross-hatch or diagonal stripe pattern OVER the pill (not a gap). The pill container remains continuous.

### 2. No Text on Pills

Remove ALL text from pill faces:

- No model name
- No customer name
- No stage abbreviations
- Color alone identifies the stage
- Tooltip on hover shows full details (keep existing tooltip)

### 3. Swimlane Grouping

Group jobs into collapsible swimlanes:

**Grouping criteria (user selectable):**

- Model (default)
- Customer
- Purchase Order
- Risk Status (Late/At-Risk vs On-Track)

**Sorting within swimlanes:**

- Secondary sort option that varies by grouping:
  - Grouped by Customer → sort by PO, Risk, or Model
  - Grouped by Model → sort by Customer, PO, or Risk
  - etc.

### 4. Visual Swimlane Distinction

- **Swimlane header row** with group name (collapsible)
- **Alternating subgroup shading**: Within a swimlane, alternate light/no shade for visual grouping of secondary sort groups

---

## Key Files to Modify

| File                                             | Purpose                                                       |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `src/lib/schedule.ts`                            | Timeline calculation - use calendar days only, no gaps        |
| `src/components/scheduling/CalendarEvent.tsx`    | Currently renders individual pills - will become unified pill |
| `src/components/scheduling/MainCalendarGrid.tsx` | Renders the grid - add swimlane grouping logic                |
| `src/components/scheduling/CalendarHeader.tsx`   | Add group/sort dropdowns                                      |
| `src/store.ts`                                   | Add swimlane state (groupBy, sortBy, collapsedSwimlanes)      |
| `src/lib/stage-constants.ts`                     | Has `STAGE_COLORS` - use these exact colors                   |

---

## Implementation Phases

### Phase 1: Unified Pill Rendering

1. Fix `buildStageTimeline()` to use calendar days for all stages (remove business day special case)
2. Create `UnifiedJobPill.tsx` component:
   - Takes a pump's full timeline (all stages)
   - Renders single container with proportionally-sized colored segments
   - No text, just colors
3. Add weekend pattern overlay (CSS diagonal stripes on Sat/Sun portions)

### Phase 2: Swimlane Structure

1. Add to store: `scheduleGroupBy`, `scheduleSortBy`, `collapsedSwimlanes`
2. Create `SwimlaneGroup.tsx` component with header and collapsible content
3. Modify `MainCalendarGrid.tsx` to group by selected criteria
4. Add alternating shade CSS for subgroups

### Phase 3: Swimlane Controls

1. Add "Group by" dropdown to `CalendarHeader.tsx`
2. Add "Sort by" dropdown (options change based on group selection)
3. Add collapse/expand all toggle

---

## Design Specs

### Stage Colors (from STAGE_COLORS in stage-constants.ts)

```
QUEUE: gray
FABRICATION: cyan/teal
STAGED_FOR_POWDER: yellow/gold
POWDER_COAT: magenta/pink
ASSEMBLY: purple
SHIP: green/emerald
CLOSED: slate
```

### Weekend Pattern

CSS diagonal stripes pattern (45° angle) in a semi-transparent dark color over the stage color beneath.

### Swimlane Header

- Left-aligned group name (e.g., "DD-6 SAFE" or "United Rentals")
- Collapse/expand chevron
- Optional: count badge showing number of jobs in group

---

## Verification Checklist

After implementation, verify:

- [ ] No visible gaps between stages in any pill
- [ ] Weekend days show diagonal stripe pattern (not gap)
- [ ] No text visible on pill faces
- [ ] Stage colors match filter button colors exactly
- [ ] Jobs correctly group by each criteria option
- [ ] Sort order works within swimlanes
- [ ] Alternating shading visible within swimlanes
- [ ] Swimlanes collapse/expand
- [ ] Tooltip still appears on hover with full job details
- [ ] Build passes (`pnpm build`)

---

## Start

Please begin with Phase 1: Unified Pill Rendering. First, explore the current implementation in the files listed above, then create a plan and start implementing.
