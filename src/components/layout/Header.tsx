import {
  Filter,
  Moon,
  Package,
  Printer,
  Search,
  Settings,
  Sun,
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
import { NAV_ITEMS, type AppView } from './navigation'

interface HeaderProps {
  currentView: AppView
  onChangeView: (view: AppView) => void
  onOpenAddPo: () => void
  onOpenSettings: () => void
}

export function Header({
  currentView,
  onChangeView,
  onOpenAddPo,
  onOpenSettings,
}: HeaderProps) {
  const { mode, toggle } = useTheme()
  const { filters, setFilters } = useApp()
  const collapsedCards = useApp((state) => state.collapsedCards)
  const toggleCollapsedCards = useApp((state) => state.toggleCollapsedCards)
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

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              className={cn(
                'header-button h-[45px] w-[45px] rounded-full border border-border/60 bg-card/70 text-foreground/70',
                currentView === id &&
                  'border-primary/40 bg-primary/15 text-foreground'
              )}
              onClick={() => onChangeView(id)}
              title={label}
              aria-label={`Go to ${label}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.5} />
            </Button>
          ))}
        </nav>

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

          {currentView === 'kanban' && (
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
          )}
        </div>
      </div>

      <ControlFlyout open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </header>
  )
}
