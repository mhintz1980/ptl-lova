# Dashboard Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a configurable dashboard engine that renders topic-driven chart collections with shared drilldowns, favorites, and topic cycling.

**Architecture:** Centralize dashboard metadata into a TS config file (chart registry + topic definitions) consumed by a dedicated `DashboardEngine` view. All charts adopt a shared `ChartProps` contract and leverage existing selectors/hooks for data + drilldowns managed by a Zustand slice. Favorites persist via localStorage and topic navigation is config-driven.

**Tech Stack:** React 18 + TypeScript, Zustand store, Recharts, Tailwind, Vitest, Testing Library.

## Topics Overview

Base topics from the original spec plus additional insights for richer chart groupings:

1. `production` – WIP & capacity signals across stages.
2. `schedule` – lead times, late orders, calendar signals.
3. `sales` – customer/model mix & value.
4. `bottlenecks` – throughput constraints + queues.
5. `quality` – rework and defect tracking.
6. `maintenance` – downtime vs uptime, queued maintenance work.
7. `supplyChain` – part shortages, PO approvals, vendor delays.
8. `financial` – value at risk, revenue pacing, unit margin snapshots.
9. `customerHealth` – promise adherence, customer-specific lateness heatmaps.
10. `workforce` – labor allocation vs demand across departments.

---

### Task 1: Define dashboard contracts & config registries

**Files:**

- Create: `src/dashboard/config.ts`
- Modify: `src/types.ts`
- Test: `src/dashboard/config.test.ts`

### Step 1: Write the failing test

```ts
// src/dashboard/config.test.ts
import { describe, expect, it } from 'vitest'
import { CHART_REGISTRY, TOPIC_CONFIGS } from './config'

describe('dashboard config', () => {
  it('maps every topic chartId to a registered chart', () => {
    const chartIds = Object.keys(CHART_REGISTRY)
    const invalid = TOPIC_CONFIGS.flatMap((topic) =>
      topic.chartIds.filter((id) => !chartIds.includes(id))
    )
    expect(invalid).toHaveLength(0)
  })
})
```

### Step 2: Run test to verify it fails

Run: `npm run test -- src/dashboard/config.test.ts`  
Expected: FAIL because `config.ts` exports don’t exist yet.

### Step 3: Write minimal implementation

```ts
// src/dashboard/config.ts
import type { ComponentType, ReactNode } from 'react';
import type { Pump, Stage } from '../types';

export type DashboardTopicId = /* ... */ ;
export type ChartId = /* ... */;

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  customerId?: string;
  modelId?: string;
  department?: 'Fabrication' | 'Powder Coat' | 'Assembly' | 'Testing & Shipping';
  stage?: Stage;
}

export interface ChartProps {
  pumps: Pump[];
  filters: DashboardFilters;
  onDrilldown: (update: Partial<DashboardFilters>) => void;
}

export interface ChartConfig {
  id: ChartId;
  title: string;
  description?: string;
  component: ComponentType<ChartProps>;
  icon?: ReactNode;
  defaultSize?: 'sm' | 'md' | 'lg';
}

export const CHART_REGISTRY: Record<ChartId, ChartConfig> = {
  /* seed with existing charts + placeholders */
};

export interface TopicConfig {
  id: DashboardTopicId;
  label: string;
  icon?: ReactNode;
  chartIds: ChartId[];
}

export const TOPIC_CONFIGS: TopicConfig[] = [
  { id: 'production', label: 'Production Overview', chartIds: ['wipByStage', 'capacityByDept', 'lateOrders'] },
  { id: 'schedule', label: 'Schedule & Lead Times', chartIds: ['leadTimeTrend', 'lateOrders'] },
  /* ... include the new maintenance/supplyChain/financial/customerHealth/workforce topics ... */
];
```

### Step 4: Run test to verify it passes

Run: `npm run test -- src/dashboard/config.test.ts`  
Expected: PASS.

### Step 5: Commit

```bash
git add src/dashboard/config.ts src/dashboard/config.test.ts
git commit -m "feat(dashboard): add config contracts and registry tests"
```

---

### Task 2: Standardize chart components on ChartProps

**Files:**

- Modify: `src/components/dashboard/*.tsx`
- Create: `src/components/dashboard/charts/WipByStageChart.tsx` (new folder for wrappers)
- Test: `src/components/dashboard/__tests__/chart-drilldowns.test.tsx`

### Step 1: Write the failing test

```tsx
// src/components/dashboard/__tests__/chart-drilldowns.test.tsx
import { render, fireEvent } from '@testing-library/react'
import { WipByStageChart } from '../charts/WipByStageChart'

it('calls onDrilldown with stage payload', () => {
  const handle = vi.fn()
  const { getByTestId } = render(
    <WipByStageChart
      pumps={[]}
      filters={{ dateRange: { from: null, to: null } }}
      onDrilldown={handle}
    />
  )
  fireEvent.click(getByTestId('chart-slice-FABRICATION'))
  expect(handle).toHaveBeenCalledWith({ stage: 'FABRICATION' })
})
```

### Step 2: Run test to verify it fails

Run: `npm run test -- src/components/dashboard/__tests__/chart-drilldowns.test.tsx`  
Expected: FAIL until charts adopt `ChartProps`.

### Step 3: Write minimal implementation

```tsx
// src/components/dashboard/charts/WipByStageChart.tsx
import { PieChart, Pie } from 'recharts'
import type { ChartProps } from '../../dashboard/config'

export function WipByStageChart({ pumps, filters, onDrilldown }: ChartProps) {
  const data = buildStageCounts(pumps, filters)
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="stage"
        onClick={(entry) => onDrilldown({ stage: entry.stage })}
      />
    </PieChart>
  )
}
```

Repeat for other charts (capacity, lead time, pumpsByCustomer, etc.) ensuring each component:

1. Accepts `{ pumps, filters, onDrilldown }`.
2. Applies filters before deriving chart data.
3. Emits semantic `onDrilldown` updates.

### Step 4: Run test to verify it passes

Run: `npm run test -- src/components/dashboard/__tests__/chart-drilldowns.test.tsx`  
Expected: PASS.

### Step 5: Commit

```bash
git add src/components/dashboard/charts src/components/dashboard/__tests__/chart-drilldowns.test.tsx
git commit -m "feat(dashboard): align charts to shared ChartProps contract"
```

---

### Task 3: Implement DashboardEngine view shell

**Files:**

- Create: `src/pages/DashboardEngine.tsx`
- Modify: `src/components/layout/navigation.ts`
- Test: `src/pages/__tests__/DashboardEngine.test.tsx`

### Step 1: Write the failing test

```tsx
// src/pages/__tests__/DashboardEngine.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardEngine } from '../DashboardEngine'
import { CHART_REGISTRY, TOPIC_CONFIGS } from '../../dashboard/config'

it('cycles topics when Next Topic pressed', () => {
  render(<DashboardEngine pumps={[]} />)
  const button = screen.getByRole('button', { name: /next topic/i })
  const firstLabel = screen.getByText(TOPIC_CONFIGS[0].label)
  fireEvent.click(button)
  expect(screen.getByText(TOPIC_CONFIGS[1].label)).toBeInTheDocument()
  expect(firstLabel).not.toBeVisible()
})
```

### Step 2: Run test to verify it fails

Run: `npm run test -- src/pages/__tests__/DashboardEngine.test.tsx`  
Expected: FAIL.

### Step 3: Write minimal implementation

```tsx
// src/pages/DashboardEngine.tsx
import { useMemo, useState } from 'react'
import { CHART_REGISTRY, TOPIC_CONFIGS, ChartId } from '../dashboard/config'
import { useApp } from '../store'

export function DashboardEngine() {
  const pumps = useApp((s) => s.filtered())
  const [topicIndex, setTopicIndex] = useState(0)
  const [filters, setFilters] = useState({
    dateRange: { from: null, to: null },
  })
  const [favoriteChartIds, setFavoriteChartIds] = useState<ChartId[]>(() =>
    loadFavs()
  )

  const topic = TOPIC_CONFIGS[topicIndex % TOPIC_CONFIGS.length]
  const chartIdsToRender = topic.chartIds.filter((id) => CHART_REGISTRY[id])

  const handleDrilldown = (update: Partial<typeof filters>) =>
    setFilters((prev) => ({ ...prev, ...update }))

  return (
    <div>
      <header>
        <button
          onClick={() => setTopicIndex((i) => (i + 1) % TOPIC_CONFIGS.length)}
        >
          Next Topic
        </button>
      </header>
      <div>
        {chartIdsToRender.map((id) => {
          const cfg = CHART_REGISTRY[id]
          const ChartComponent = cfg.component
          return (
            <div key={id}>
              <h2>{cfg.title}</h2>
              <ChartComponent
                pumps={pumps}
                filters={filters}
                onDrilldown={handleDrilldown}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Step 4: Run test to verify it passes

Run: `npm run test -- src/pages/__tests__/DashboardEngine.test.tsx`  
Expected: PASS.

### Step 5: Commit

```bash
git add src/pages/DashboardEngine.tsx src/pages/__tests__/DashboardEngine.test.tsx src/components/layout/navigation.ts
git commit -m "feat(dashboard): add dashboard engine shell"
```

---

### Task 4: Favorites mode + persistence

**Files:**

- Modify: `src/pages/DashboardEngine.tsx`
- Create: `src/lib/dashboardFavorites.ts`
- Test: `src/lib/dashboardFavorites.test.ts`

### Step 1: Write the failing test

```ts
// src/lib/dashboardFavorites.test.ts
import { describe, expect, it } from 'vitest'
import { toggleFavorite, loadFavorites } from './dashboardFavorites'

describe('dashboard favorites', () => {
  it('persists favorites to localStorage', () => {
    localStorage.clear()
    const afterToggle = toggleFavorite(['wipByStage'], 'lateOrders')
    expect(afterToggle).toEqual(
      expect.arrayContaining(['wipByStage', 'lateOrders'])
    )
    expect(loadFavorites()).toEqual(afterToggle)
  })
})
```

### Step 2: Run test to verify it fails

Run: `npm run test -- src/lib/dashboardFavorites.test.ts`  
Expected: FAIL until helpers exist.

### Step 3: Write minimal implementation

```ts
// src/lib/dashboardFavorites.ts
import type { ChartId } from '../dashboard/config'
const KEY = 'dashboard-favorites'

export const loadFavorites = (): ChartId[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export const saveFavorites = (ids: ChartId[]) => {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export const toggleFavorite = (current: ChartId[], id: ChartId) => {
  const next = current.includes(id)
    ? current.filter((c) => c !== id)
    : [...current, id]
  saveFavorites(next)
  return next
}
```

Integrate helpers inside `DashboardEngine` so the UI can switch between “Topic mode” and “Favorites mode” (button toggles which list of chart IDs renders).

### Step 4: Run test to verify it passes

Run: `npm run test -- src/lib/dashboardFavorites.test.ts src/pages/__tests__/DashboardEngine.test.tsx`  
Expected: PASS.

### Step 5: Commit

```bash
git add src/lib/dashboardFavorites.ts src/lib/dashboardFavorites.test.ts src/pages/DashboardEngine.tsx
git commit -m "feat(dashboard): add favorites persistence"
```

---

### Task 5: Shared filter bar & breadcrumb drilldown

**Files:**

- Create: `src/components/dashboard/FilterBreadcrumb.tsx`
- Modify: `src/pages/DashboardEngine.tsx`
- Test: `src/components/dashboard/__tests__/filter-breadcrumb.test.tsx`

### Step 1: Write the failing test

```tsx
// src/components/dashboard/__tests__/filter-breadcrumb.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBreadcrumb } from '../FilterBreadcrumb'

it('clears a filter segment when clicked', () => {
  const handle = vi.fn()
  render(
    <FilterBreadcrumb
      filters={{
        dateRange: { from: null, to: null },
        stage: 'FABRICATION',
        customerId: 'sunbelt',
      }}
      onClear={handle}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /stage/i }))
  expect(handle).toHaveBeenCalledWith('stage')
})
```

### Step 2: Run test to verify it fails

Run: `npm run test -- src/components/dashboard/__tests__/filter-breadcrumb.test.tsx`  
Expected: FAIL.

### Step 3: Write minimal implementation

```tsx
// src/components/dashboard/FilterBreadcrumb.tsx
import type { DashboardFilters } from '../../dashboard/config'

export function FilterBreadcrumb({
  filters,
  onClear,
}: {
  filters: DashboardFilters
  onClear: (key: keyof DashboardFilters) => void
}) {
  const chips = Object.entries(filters).filter(([, value]) => value)
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {chips.map(([key, value]) => (
        <button
          key={key}
          onClick={() => onClear(key as keyof DashboardFilters)}
        >
          {key}: {String(value)}
        </button>
      ))}
    </div>
  )
}
```

Wire into `DashboardEngine` so charts mutate filters via `onDrilldown`, breadcrumbs list active filters, and clearing resets values plus notifies charts.

### Step 4: Run test to verify it passes

Run: `npm run test -- src/components/dashboard/__tests__/filter-breadcrumb.test.tsx`  
Expected: PASS.

### Step 5: Commit

```bash
git add src/components/dashboard/FilterBreadcrumb.tsx src/components/dashboard/__tests__/filter-breadcrumb.test.tsx src/pages/DashboardEngine.tsx
git commit -m "feat(dashboard): add shared filter breadcrumb"
```

---

## To-Do Checklist

- [ ] T1 – Config contracts established and covered by config registry tests.
- [ ] T2 – All charts migrated to `ChartProps` and drilldown tests passing.
- [ ] T3 – `DashboardEngine` view renders topic charts + next-topic navigation.
- [ ] T4 – Favorites persistence helpers + favorites-mode toggle working.
- [ ] T5 – Filter breadcrumb + shared drilldown clear actions implemented.
