import { Button } from '../ui/Button'
import {
  STAGE_COLORS,
  STAGE_LABELS,
  PRODUCTION_STAGES,
} from '../../lib/stage-constants'
import { cn } from '../../lib/utils'
import { useApp } from '../../store'
import { Wand2, Trash2, ChevronDown, Minimize2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { LockDatePicker } from '../toolbar/LockDatePicker'
import { useState, useRef, useEffect } from 'react'

// Group by options
const GROUP_OPTIONS = [
  { value: 'model', label: 'Model' },
  { value: 'customer', label: 'Customer' },
  { value: 'po', label: 'Purchase Order' },
  { value: 'risk', label: 'Risk Status' },
] as const

// Sort options based on group selection
const SORT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  model: [
    { value: 'customer', label: 'Customer' },
    { value: 'po', label: 'PO' },
    { value: 'startDate', label: 'Start Date' },
  ],
  customer: [
    { value: 'model', label: 'Model' },
    { value: 'po', label: 'PO' },
    { value: 'startDate', label: 'Start Date' },
  ],
  po: [
    { value: 'model', label: 'Model' },
    { value: 'customer', label: 'Customer' },
    { value: 'startDate', label: 'Start Date' },
  ],
  risk: [
    { value: 'model', label: 'Model' },
    { value: 'customer', label: 'Customer' },
    { value: 'startDate', label: 'Start Date' },
  ],
}

// Simple dropdown component
function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
          'border-border/70 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-primary/10',
          open && 'border-primary/50 bg-primary/10'
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <span>{selectedLabel}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg border border-border/60 bg-popover shadow-lg py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'w-full px-3 py-1.5 text-left text-xs hover:bg-muted/50 transition-colors',
                value === option.value &&
                  'bg-primary/10 text-primary font-medium'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CalendarHeader() {
  const clearQueueForecastHints = useApp(
    (state) => state.clearQueueForecastHints
  )
  const autoSetForecastHints = useApp((state) => state.autoSetForecastHints)
  const stageFilters = useApp((state) => state.schedulingStageFilters)
  const toggleStageFilter = useApp((state) => state.toggleSchedulingStageFilter)
  const clearStageFilters = useApp((state) => state.clearSchedulingStageFilters)

  // Swimlane controls
  const scheduleGroupBy = useApp((state) => state.scheduleGroupBy)
  const scheduleSortBy = useApp((state) => state.scheduleSortBy)
  const setScheduleGroupBy = useApp((state) => state.setScheduleGroupBy)
  const setScheduleSortBy = useApp((state) => state.setScheduleSortBy)
  const collapseAllSwimlanes = useApp((state) => state.collapseAllSwimlanes)
  const expandAllSwimlanes = useApp((state) => state.expandAllSwimlanes)
  const collapsedSwimlanes = useApp((state) => state.collapsedSwimlanes)

  const hasCollapsed = Object.values(collapsedSwimlanes).some(Boolean)

  const handleClear = () => {
    const cleared = clearQueueForecastHints()
    if (!cleared) {
      toast.info('No scheduled jobs to clear.')
      return
    }
    toast.success(
      `Cleared ${cleared} scheduled job${cleared === 1 ? '' : 's'}.`
    )
  }

  const handleAuto = () => {
    const scheduled = autoSetForecastHints()
    if (!scheduled) {
      toast.info('No jobs could be auto-scheduled.')
      return
    }
    toast.success(
      `Auto-scheduled ${scheduled} job${scheduled === 1 ? '' : 's'}.`
    )
  }

  return (
    <div
      className="border-b border-border/70 bg-card/90 px-4 py-4 text-foreground"
      data-testid="calendar-header"
    >
      {/* First Row: Stage Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-x-auto pr-4">
          {PRODUCTION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40',
                stageFilters.includes(stage)
                  ? 'border-primary/60 bg-primary/15 text-primary shadow-sm'
                  : 'border-border/70 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
              )}
              aria-pressed={stageFilters.includes(stage)}
              data-stage-filter={stage}
              onClick={() => toggleStageFilter(stage)}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full border',
                  STAGE_COLORS[stage]
                )}
                aria-hidden="true"
              />
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LockDatePicker />

          {stageFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
              onClick={clearStageFilters}
            >
              Clear Filters
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleAuto}
          >
            <Wand2 className="mr-2 h-3.5 w-3.5" />
            Auto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleClear}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Second Row: Swimlane Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
        <Dropdown
          label="Group by"
          value={scheduleGroupBy}
          options={[...GROUP_OPTIONS]}
          onChange={(v) => setScheduleGroupBy(v as typeof scheduleGroupBy)}
        />
        <Dropdown
          label="Sort by"
          value={scheduleSortBy}
          options={SORT_OPTIONS[scheduleGroupBy] || SORT_OPTIONS.model}
          onChange={setScheduleSortBy}
        />
        <button
          type="button"
          onClick={() =>
            hasCollapsed ? expandAllSwimlanes() : collapseAllSwimlanes()
          }
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
            'border-border/70 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-primary/10'
          )}
          title={
            hasCollapsed ? 'Expand All Swimlanes' : 'Collapse All Swimlanes'
          }
        >
          {hasCollapsed ? (
            <>
              <Maximize2 className="h-3 w-3" />
              <span>Expand All</span>
            </>
          ) : (
            <>
              <Minimize2 className="h-3 w-3" />
              <span>Collapse All</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
