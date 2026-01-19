import { useMemo, useState, useEffect, memo } from 'react'
import type { Pump } from '../../types'
import {
  ChartId,
  DashboardFilters,
  DashboardMode,
  MODE_CONFIGS,
} from './dashboardConfig'
import { CHART_REGISTRY } from './chartRegistry'
import { motion, AnimatePresence } from 'motion/react'
import {
  Star,
  FilterX,
  Home,
  ChevronRight as BreadcrumbSeparator,
  Activity,
  BarChart2,
  Table,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ModeKpis } from './ModeKpis'
import { DateRangePicker } from './DateRangePicker'
import { useApp } from '../../store'

const EMPTY_FILTERS: DashboardFilters = {
  dateRange: { from: null, to: null },
}

const FAVORITES_KEY = 'pumptracker.dashboard.favorites'
const MODE_KEY = 'pumptracker.dashboard.mode'

const MODE_ICONS: Record<DashboardMode, React.ElementType> = {
  overview: Activity,
  analysis: BarChart2,
  data: Table,
}

interface DashboardEngineProps {
  onSelectPump?: (pump: Pump) => void
}

interface DrillState {
  chartId: ChartId
  filters: DashboardFilters
  label: string
}

export const DashboardEngine = memo(function DashboardEngine({
  onSelectPump,
}: DashboardEngineProps) {
  const { pumps } = useApp()
  const [mode, setMode] = useState<DashboardMode>('overview')
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)
  const [favoriteChartIds, setFavoriteChartIds] = useState<ChartId[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [drillStack, setDrillStack] = useState<DrillState[]>([])

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      if (raw) {
        setFavoriteChartIds(JSON.parse(raw))
      }
    } catch {
      // ignore
    }
  }, [])

  // Load mode from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MODE_KEY)
      if (raw && ['overview', 'analysis', 'data'].includes(raw)) {
        setMode(raw as DashboardMode)
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteChartIds))
  }, [favoriteChartIds])

  // Persist mode
  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  const currentModeConfig = useMemo(
    () => MODE_CONFIGS.find((m) => m.id === mode) || MODE_CONFIGS[0],
    [mode]
  )

  const chartIdsToRender: ChartId[] = useMemo(() => {
    if (drillStack.length > 0) {
      return [drillStack[drillStack.length - 1].chartId]
    }
    if (showFavorites && favoriteChartIds.length > 0) {
      return favoriteChartIds
    }
    return currentModeConfig.chartIds
  }, [showFavorites, favoriteChartIds, currentModeConfig, drillStack])

  const handleModeChange = (newMode: DashboardMode) => {
    setShowFavorites(false)
    setFilters(EMPTY_FILTERS)
    setDrillStack([])
    setMode(newMode)
  }

  const toggleFavorite = (chartId: ChartId) => {
    setFavoriteChartIds((prev) =>
      prev.includes(chartId)
        ? prev.filter((id) => id !== chartId)
        : [...prev, chartId]
    )
  }

  const handleDrilldown = (
    sourceChartId: ChartId,
    update: Partial<DashboardFilters>
  ) => {
    const cfg = CHART_REGISTRY[sourceChartId]
    if (!cfg || !cfg.drillDownSequence || cfg.drillDownSequence.length === 0) {
      // Fallback to old behavior: just update filters
      setFilters((prev) => ({ ...prev, ...update }))
      return
    }

    const nextChartId = cfg.drillDownSequence[0]
    const newFilters = { ...filters, ...update }

    // Determine label for breadcrumb
    let label = 'Details'
    if (update.customerId) label = update.customerId
    else if (update.modelId) label = update.modelId
    else if (update.stage) label = update.stage

    setDrillStack((prev) => [
      ...prev,
      {
        chartId: nextChartId,
        filters: newFilters,
        label,
      },
    ])
    setFilters(newFilters)
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setDrillStack([])
      setFilters(EMPTY_FILTERS)
    } else {
      const targetState = drillStack[index]
      setDrillStack((prev) => prev.slice(0, index + 1))
      setFilters(targetState.filters)
    }
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setDrillStack([])
  }

  const hasActiveFilters = Object.keys(filters).some(
    (k) =>
      k !== 'dateRange' && filters[k as keyof DashboardFilters] !== undefined
  )

  const isDrillMode = drillStack.length > 0

  return (
    <div className="flex flex-col gap-6 p-0 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
      {/* Header / Controls - Condensed Layout */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: KPIs or Breadcrumbs */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDrillMode ? (
            <div className="rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm px-4 py-2.5">
              <nav className="flex items-center text-sm font-medium text-muted-foreground">
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </button>
                {drillStack.map((step, idx) => (
                  <div key={idx} className="flex items-center">
                    <BreadcrumbSeparator className="h-4 w-4 mx-1 opacity-70" />
                    <button
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={`hover:text-foreground transition-colors ${
                        idx === drillStack.length - 1
                          ? 'text-foreground font-semibold'
                          : ''
                      }`}
                      disabled={idx === drillStack.length - 1}
                    >
                      {step.label}
                    </button>
                  </div>
                ))}
              </nav>
            </div>
          ) : (
            <>
              {/* KPIs inline in header (not below) */}
              {!showFavorites && (
                <ModeKpis
                  pumps={pumps}
                  mode={mode}
                  onKpiClick={(_kpiId, filter) => {
                    setFilters((prev) => ({ ...prev, ...filter }))
                  }}
                  compact={true}
                />
              )}
              {hasActiveFilters && (
                <Badge variant="secondary" className="animate-in zoom-in">
                  Filtered
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Right: Mode Chips + Favorites + Clear Filters */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && !isDrillMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-4 w-4" />
              Clear
            </Button>
          )}

          {!isDrillMode && (
            <>
              {/* Date Range Filter */}
              <DateRangePicker
                from={filters.dateRange.from}
                to={filters.dateRange.to}
                onChange={(dateRange) =>
                  setFilters((prev) => ({ ...prev, dateRange }))
                }
              />

              {/* Mode Toggle Chips */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                {MODE_CONFIGS.map((m) => {
                  const ModeIcon = MODE_ICONS[m.id]
                  const isActive = mode === m.id && !showFavorites
                  return (
                    <Button
                      key={m.id}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleModeChange(m.id)}
                      className="gap-2"
                    >
                      <ModeIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{m.label}</span>
                    </Button>
                  )
                })}
              </div>

              <Button
                variant={showFavorites ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowFavorites((prev) => !prev)}
                className="gap-2"
              >
                <Star
                  className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`}
                />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters summary (for drilldowns) - only show if NOT in drill mode (breadcrumbs handle context there) */}
      {hasActiveFilters && !isDrillMode && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => {
            if (key === 'dateRange' || !value) return null
            return (
              <Badge
                key={key}
                variant="outline"
                className="px-3 py-1 text-sm bg-background/50 backdrop-blur-sm"
              >
                <span className="opacity-70 mr-1 capitalize">
                  {key.replace('Id', '')}:
                </span>
                <span className="font-medium">{String(value)}</span>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Charts grid */}
      <div
        className={`grid gap-6 grid-cols-12 grid-flow-dense auto-rows-min ${
          isDrillMode ? 'grid-cols-1' : ''
        }`}
      >
        <AnimatePresence mode="popLayout">
          {chartIdsToRender.map((chartId) => {
            const cfg = CHART_REGISTRY[chartId]
            if (!cfg) return null

            const ChartComponent = cfg.component
            const isFav = favoriteChartIds.includes(chartId)

            // Map size to 12-column grid
            const sizeToColSpan: Record<string, string> = {
              max: 'md:col-span-12 col-span-12',
              full: 'md:col-span-12 col-span-12',
              'three-quarter': 'md:col-span-9 col-span-12',
              large: 'md:col-span-8 col-span-12',
              half: 'md:col-span-6 col-span-12',
              third: 'md:col-span-4 col-span-12',
              small: 'md:col-span-4 col-span-12',
              quarter: 'md:col-span-3 col-span-12',
              mini: 'md:col-span-3 col-span-12',
            }
            const colSpan = isDrillMode
              ? 'col-span-12'
              : sizeToColSpan[cfg.defaultSize || 'small']

            // Apply fixed height from registry (default 450px)
            // If containerClass is present, we assume it handles height (unless explicit height is also provided)
            const chartHeight = cfg.height || 450
            const useExplicitHeight = !cfg.containerClass && !isDrillMode

            return (
              <motion.div
                key={chartId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                // [HIERARCHY-1] THE DASHBOARD CARD (OUTER WRAPPER)
                // Controls width (col-span) and fixed height for consistent rows
                className={`relative rounded-3xl border border-border/40 bg-card/50 backdrop-blur-xl p-[5px] shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/80 group flex flex-col ${colSpan} ${
                  isDrillMode ? 'min-h-[calc(100vh-200px)]' : ''
                } ${cfg.containerClass || ''}`}
                style={
                  useExplicitHeight ? { height: `${chartHeight}px` } : undefined
                }
              >
                <div className="mb-0 flex items-start justify-end flex-shrink-0">
                  {!isDrillMode && (
                    <button
                      onClick={() => toggleFavorite(chartId)}
                      className={`p-1.5 rounded-full transition-colors ${
                        isFav
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-muted-foreground/30 hover:text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`}
                      />
                    </button>
                  )}
                </div>

                <div
                  // [HIERARCHY-2] THE CHART CONTENT WRAPPER
                  // Clips overflow and allows content to dictate height (min-h-0)
                  className={
                    isDrillMode
                      ? 'w-full relative overflow-hidden min-h-0'
                      : 'w-full relative overflow-hidden min-h-0'
                  }
                >
                  <ChartComponent
                    filters={filters}
                    onDrilldown={(update) => handleDrilldown(chartId, update)}
                    chartHeight={cfg.height}
                    onSelectPump={onSelectPump}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
})
