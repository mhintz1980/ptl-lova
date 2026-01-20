// src/components/kanban/StageColumn.tsx
import { Pump, Stage } from '../../types'
import { PumpCard } from './PumpCard'
import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react'
import { useApp } from '../../store'
import { cn } from '../../lib/utils'
import { useMemo } from 'react'
import { sortPumps } from '../../lib/sort'

interface StageColumnProps {
  stage: Stage
  pumps: Pump[]
  collapsed: boolean
  onCardClick?: (pump: Pump) => void
  activeId?: string | null
}

export function StageColumn({
  stage,
  pumps,
  collapsed,
  onCardClick,
  activeId,
}: StageColumnProps) {
  const {
    collapsedStages,
    toggleStageCollapse,
    wipLimits,
    sortField,
    sortDirection,
  } = useApp()
  const isCollapsed = collapsedStages[stage]
  const wipLimit = wipLimits?.[stage] ?? null
  const sortedPumps = useMemo(
    () => sortPumps(pumps, sortField, sortDirection),
    [pumps, sortField, sortDirection]
  )
  const isOverLimit =
    typeof wipLimit === 'number' ? sortedPumps.length > wipLimit : false
  const countLabel =
    wipLimit != null
      ? `${sortedPumps.length} / ${wipLimit}`
      : `${sortedPumps.length}`

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: 'column', stage },
  })

  // Constitution §2.1: Canonical stage accent colors
  const stageAccent: Record<Stage, string> = {
    QUEUE: 'bg-slate-400',
    FABRICATION: 'bg-blue-500',
    STAGED_FOR_POWDER: 'bg-cyan-500',
    POWDER_COAT: 'bg-purple-500',
    ASSEMBLY: 'bg-amber-500',
    SHIP: 'bg-emerald-500',
    CLOSED: 'bg-green-500',
  }

  // Contextual empty state messages
  const emptyStateMessages: Record<Stage, string> = {
    QUEUE: 'No orders in queue. Add a new PO to get started.',
    FABRICATION:
      'No pumps in fabrication. Drag from Queue to start production.',
    STAGED_FOR_POWDER: 'No pumps staged. Items here await powder coating.',
    POWDER_COAT: 'No pumps at powder coat. Items are at external vendor.',
    ASSEMBLY: 'No pumps in assembly. Drag completed fabrication here.',
    SHIP: 'No pumps ready to ship. Complete assembly to ship orders.',
    CLOSED: 'No completed orders. Shipped orders appear here.',
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
          data-stage-header={stage}
          data-over-limit={isOverLimit || undefined}
          className={cn(
            'flex w-full items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-3 py-2.5 text-left transition-colors',
            isOverLimit
              ? 'bg-destructive/15 hover:bg-destructive/20 border-destructive/40'
              : 'hover:bg-card'
          )}
          onClick={() => toggleStageCollapse(stage)}
        >
          <div className="flex flex-1 items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${stageAccent[stage]}`}
            ></span>
            <div className="flex flex-1 items-center justify-between text-sm font-semibold text-foreground">
              <span className="truncate" title={stage}>
                {stage}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isOverLimit ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {countLabel}
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
          <div
            ref={setNodeRef}
            className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-themed"
          >
            {sortedPumps.map((pump) =>
              activeId === pump.id ? null : (
                <PumpCard
                  key={pump.id}
                  pump={pump}
                  collapsed={collapsed}
                  onClick={() => onCardClick?.(pump)}
                />
              )
            )}
            {pumps.length === 0 && (
              <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 text-center text-xs text-muted-foreground">
                <Inbox className="h-5 w-5 opacity-50" />
                <span>{emptyStateMessages[stage]}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
