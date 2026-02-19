import {
  BarChart3,
  Calendar,
  Filter,
  Moon,
  Package,
  Printer,
  Search,
  Settings,
  Sun,
  AlertTriangle,
  Activity,
  Clock,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../../lib/utils'
import { useTheme } from '../../hooks/useTheme'
import { ControlFlyout } from './ControlFlyout'
import { useApp } from '../../store'
import { AddPoButton } from '../toolbar/AddPoButton'
import { CollapseToggle } from './CollapseToggle'

interface HeaderProps {
  onOpenAddPo: () => void
  onOpenSettings: () => void
}

export function Header({ onOpenAddPo, onOpenSettings }: HeaderProps) {
  const { mode, toggle } = useTheme()
  const { pumps, filters, setFilters } = useApp()
  const collapsedCards = useApp((state) => state.collapsedCards)
  const toggleCollapsedCards = useApp((state) => state.toggleCollapsedCards)
  const toggleChartsDrawer = useApp((state) => state.toggleChartsDrawer)
  const toggleScheduleModal = useApp((state) => state.toggleScheduleModal)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = useMemo(
    () =>
      [
        filters.q,
        filters.po,
        filters.customer,
        filters.model,
        filters.priority,
        filters.stage,
      ].filter(Boolean).length,
    [filters]
  )

  // KPI calculations
  const kpis = useMemo(() => {
    const nonClosed = pumps.filter((p) => p.stage !== 'CLOSED')
    const active = nonClosed.length

    // Late count: pumps past promise date
    const now = new Date()
    const late = nonClosed.filter((p) => {
      if (!p.promiseDate) return false
      return new Date(p.promiseDate) < now
    }).length

    // Average build time: days from creation to CLOSED for closed pumps
    const closedPumps = pumps.filter((p) => p.stage === 'CLOSED')
    let avgBuildTime = 0
    if (closedPumps.length > 0) {
      const totalDays = closedPumps.reduce((sum, p) => {
        if (!p.dateReceived || !p.last_update) return sum
        const start = new Date(p.dateReceived).getTime()
        const end = new Date(p.last_update).getTime()
        const days = Math.max(
          1,
          Math.round((end - start) / (1000 * 60 * 60 * 24))
        )
        return sum + days
      }, 0)
      avgBuildTime = Math.round(totalDays / closedPumps.length)
    }

    // Efficiency: closed / total as percentage
    const efficiency =
      pumps.length > 0
        ? Math.round((closedPumps.length / pumps.length) * 100)
        : 0

    return { active, late, avgBuildTime, efficiency }
  }, [pumps])

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 text-foreground backdrop-blur-xl">
      <div className="relative flex h-[60px] items-center justify-between px-[14px]">
        <div className="flex min-w-[180px] items-center gap-3">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-2 shadow-layer-sm">
            <Package className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              PumpTracker
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Flow Ops
            </span>
          </div>
        </div>

        {/* KPI Badges — replacing nav icons */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5"
            title="Active pumps (non-closed)"
          >
            <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-foreground">
              {kpis.active}
            </span>
            <span className="text-[10px] text-muted-foreground">Active</span>
          </div>

          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5',
              kpis.late > 0
                ? 'border-destructive/40 bg-destructive/10'
                : 'border-border/60 bg-card/70'
            )}
            title="Pumps past promise date"
          >
            <AlertTriangle
              className={cn(
                'h-3.5 w-3.5',
                kpis.late > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
              strokeWidth={2.5}
            />
            <span
              className={cn(
                'text-xs font-semibold',
                kpis.late > 0 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {kpis.late}
            </span>
            <span className="text-[10px] text-muted-foreground">Late</span>
          </div>

          <div
            className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 md:flex"
            title="Average build time (days)"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-foreground">
              {kpis.avgBuildTime}d
            </span>
            <span className="text-[10px] text-muted-foreground">Avg</span>
          </div>

          <div
            className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 lg:flex"
            title="Completion efficiency"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-foreground">
              {kpis.efficiency}%
            </span>
            <span className="text-[10px] text-muted-foreground">Done</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden h-[40px] w-[225px] items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 text-sm text-foreground/80 shadow-sm md:flex">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <Input
              value={filters.q || ''}
              onChange={(event) => setFilters({ q: event.target.value })}
              placeholder="Search"
              className="h-full w-full border-none bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="header-button relative h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Filter className="h-5 w-5" strokeWidth={2.5} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <CollapseToggle
            collapsed={collapsedCards}
            onToggle={toggleCollapsedCards}
          />

          {/* Charts drawer toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="header-button h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={toggleChartsDrawer}
            title="Charts & Analytics"
            aria-label="Toggle Charts Drawer"
          >
            <BarChart3 className="h-5 w-5" strokeWidth={2.5} />
          </Button>

          {/* Schedule modal toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="header-button h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={toggleScheduleModal}
            title="Schedule Forecast"
            aria-label="Open Schedule Modal"
          >
            <Calendar className="h-5 w-5" strokeWidth={2.5} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="header-button h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={toggle}
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? (
              <Sun className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={2.5} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="header-button h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={onOpenSettings}
            title="Settings"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" strokeWidth={2.5} />
          </Button>

          <AddPoButton onClick={onOpenAddPo} />

          <Button
            variant="ghost"
            size="icon"
            className="header-button h-[40px] w-[40px] rounded-full border border-border/60 bg-card/80 text-foreground ml-2"
            onClick={() => window.open('/print/kanban', '_blank')}
            title="Print View"
            aria-label="Print Kanban Board"
          >
            <Printer className="h-5 w-5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      <ControlFlyout open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </header>
  )
}
