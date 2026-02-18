// src/components/kanban/ClosedLane.tsx
import { Pump, Stage } from '../../types'
import { ManifestItem } from './ManifestItem'
import { useDroppable } from '@dnd-kit/core'
import {
  ChevronDown,
  ChevronUp,
  Inbox,
  LayoutDashboard,
  Truck,
} from 'lucide-react'
import { useApp } from '../../store'
import { cn } from '../../lib/utils'
import { useMemo, useState } from 'react'
import { Progress } from '../ui/Progress'
import { isToday, isYesterday, isThisWeek, parseISO } from 'date-fns'

interface ClosedLaneProps {
  stage: Stage
  pumps: Pump[]
  allPumps: Pump[]
  activeId?: string | null
  onCardClick?: (pump: Pump) => void
}

export function ClosedLane({
  stage,
  pumps,
  allPumps,
  activeId,
  onCardClick,
}: ClosedLaneProps) {
  const collapsedStages = useApp((state) => state.collapsedStages)
  const toggleStageCollapse = useApp((state) => state.toggleStageCollapse)
  const moveStage = useApp((state) => state.moveStage)
  const setFilters = useApp((state) => state.setFilters)

  const isCollapsed = collapsedStages[stage]

  const poStats = useMemo(() => {
    const stats: Record<string, { total: number; closed: number }> = {}

    // Count all pumps per PO
    allPumps.forEach((p) => {
      if (!stats[p.po]) stats[p.po] = { total: 0, closed: 0 }
      stats[p.po].total++
    })

    // Count closed pumps per PO
    pumps.forEach((p) => {
      if (stats[p.po]) stats[p.po].closed++
    })

    // Filter for "Active" POs: have some closed, but not all
    return Object.entries(stats)
      .filter(([_, s]) => s.closed > 0 && s.closed < s.total)
      .sort((a, b) => b[1].closed / b[1].total - a[1].closed / a[1].total)
  }, [allPumps, pumps])

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Today: true,
      Yesterday: true,
      'This Week': true,
      Older: false,
    }
  )

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: 'column', stage },
  })

  const groupedPumps = useMemo(() => {
    const groups: Record<string, Pump[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    }

    pumps
      .filter((p) => p.id !== activeId)
      .forEach((pump) => {
        const date = parseISO(pump.last_update)
        if (isToday(date)) {
          groups.Today.push(pump)
        } else if (isYesterday(date)) {
          groups.Yesterday.push(pump)
        } else if (isThisWeek(date)) {
          groups['This Week'].push(pump)
        } else {
          groups.Older.push(pump)
        }
      })

    // Sort within groups by date descending
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) =>
          parseISO(b.last_update).getTime() - parseISO(a.last_update).getTime()
      )
    })

    return groups
  }, [pumps, activeId])

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const handleReopen = (pump: Pump) => {
    // Strict Process: Reopening always goes to Shipping for verification
    moveStage(pump.id, 'SHIP')
  }

  return (
    <div className="flex h-full w-[260px] flex-shrink-0 flex-col">
      <div
        className={cn(
          'flex h-full flex-col layer-l2 overflow-hidden transition-shadow',
          isOver && 'ring-2 ring-accent/40'
        )}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-3 py-2.5 text-left transition-colors hover:bg-card"
          onClick={() => toggleStageCollapse(stage)}
        >
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-1 items-center justify-between text-sm font-semibold text-foreground">
              <span>{stage}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {pumps.length}
              </span>
            </div>
          </div>
          <span className="text-muted-foreground hover:text-foreground">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </span>
        </button>

        {!isCollapsed && (
          <>
            {/* Scoreboard (Active Zone) */}
            {poStats.length > 0 && (
              <div className="border-b border-border/40 bg-muted/30 px-3 py-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <LayoutDashboard className="h-3 w-3" />
                  <span>PO Scoreboard</span>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none pr-1">
                  {poStats.map(([po, s]) => {
                    const percent = Math.round((s.closed / s.total) * 100)
                    return (
                      <div
                        key={po}
                        className="group flex flex-col gap-1 cursor-pointer"
                        onClick={() => setFilters({ po, q: undefined })}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                            {po}
                          </span>
                          <span className="text-muted-foreground">
                            {s.closed}/{s.total} items ({percent}%)
                          </span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div
              ref={setNodeRef}
              className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-themed"
              data-testid="kanban-column-CLOSED"
            >
              {pumps.length === 0 ? (
                <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 text-center text-xs text-muted-foreground">
                  <Inbox className="h-5 w-5 opacity-50" />
                  <span>No completed orders. Shipped orders appear here.</span>
                </div>
              ) : (
                Object.entries(groupedPumps).map(([group, items]) => {
                  if (items.length === 0) return null
                  const isExpanded = expandedGroups[group]

                  return (
                    <div key={group} className="space-y-1.5">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="flex w-full items-center gap-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )}
                        {group} ({items.length})
                      </button>
                      {isExpanded && (
                        <div className="space-y-1">
                          {items.map((pump) => (
                            <ManifestItem
                              key={pump.id}
                              pump={pump}
                              onReopen={handleReopen}
                              onClick={onCardClick}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
