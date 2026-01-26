// src/components/scheduling/UnifiedJobPill.tsx
// Schedule Page v2: Unified pill rendering - one pill per job with internal stage segments

import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import type { CalendarStageEvent } from '../../lib/projection-engine'
import type { StageBlock } from '../../lib/schedule'
import type { Pump } from '../../types'
import { STAGE_COLORS, STAGE_LABELS } from '../../lib/stage-constants'
import { getCustomerColor } from '../../lib/customerColors'
import { Tooltip } from '../ui/Tooltip'
import {
  calculateRisk,
  getRiskClasses,
  type RiskStatus,
} from '../../lib/riskCalculator'
import { useDraggable } from '@dnd-kit/core'
import { isWeekend, addDays } from 'date-fns'
import { User, Box, Flag, CalendarClock } from 'lucide-react'

interface UnifiedJobPillProps {
  pump: Pump
  timeline: StageBlock[]
  viewStart: Date
  totalDays: number
  onClick?: (event: CalendarStageEvent) => void
  rowIndex: number
}

// Priority badge configuration
const MS_PER_DAY = 24 * 60 * 60 * 1000

const PRIORITY_BADGES: Record<
  Pump['priority'],
  { label: string; bgClass: string } | null
> = {
  Urgent: { label: 'U', bgClass: 'bg-rose-500 text-white' },
  Rush: { label: 'R', bgClass: 'bg-amber-500 text-white' },
  High: { label: 'H', bgClass: 'bg-orange-400 text-white' },
  Normal: null,
  Low: null,
}

export function UnifiedJobPill({
  pump,
  timeline,
  viewStart,
  totalDays,
  onClick,
  rowIndex,
}: UnifiedJobPillProps) {
  const CELL_WIDTH = 50

  // Calculate the overall pill bounds
  const pillBounds = useMemo(() => {
    if (!timeline.length) return null

    const firstBlock = timeline[0]
    const lastBlock = timeline[timeline.length - 1]

    const pillStart =
      (firstBlock.start.getTime() - viewStart.getTime()) / MS_PER_DAY
    const pillEnd = (lastBlock.end.getTime() - viewStart.getTime()) / MS_PER_DAY

    // Clamp to view range
    const clampedStart = Math.max(0, pillStart)
    const clampedEnd = Math.min(totalDays, pillEnd)

    if (clampedEnd <= clampedStart) return null

    return {
      startIndex: clampedStart,
      span: clampedEnd - clampedStart,
      originalStart: pillStart,
      originalEnd: pillEnd,
    }
  }, [timeline, viewStart, totalDays])

  // DEBUG: Log pillBounds for debugging
  console.log(
    '[DEBUG UnifiedJobPill]',
    pump.id.slice(-6),
    'pillBounds:',
    JSON.stringify(pillBounds),
    'timeline.length:',
    timeline.length
  )

  // Calculate internal segment proportions
  const segments = useMemo(() => {
    if (!pillBounds || !timeline.length) return []

    return timeline
      .map((block) => {
        // Calculate block position relative to pill, clamped to view
        const blockStart = Math.max(
          0,
          (block.start.getTime() - viewStart.getTime()) / MS_PER_DAY
        )
        const blockEnd = Math.min(
          totalDays,
          (block.end.getTime() - viewStart.getTime()) / MS_PER_DAY
        )

        // Position within the pill
        const offsetInPill = blockStart - pillBounds.startIndex
        const widthInPill = blockEnd - blockStart

        // Check if any day in this segment is a weekend
        const hasWeekend = (() => {
          const segmentStartDate = addDays(viewStart, Math.floor(blockStart))
          const segmentEndDate = addDays(viewStart, Math.ceil(blockEnd))
          let current = segmentStartDate
          while (current < segmentEndDate) {
            if (isWeekend(current)) return true
            current = addDays(current, 1)
          }
          return false
        })()

        const workingDays = block.days ?? 0
        const pausedDays = block.pausedDays ?? 0
        const pausedRatio =
          workingDays > 0 ? Math.min(1, pausedDays / workingDays) : 0

        return {
          stage: block.stage,
          offsetPercent: (offsetInPill / pillBounds.span) * 100,
          widthPercent: (widthInPill / pillBounds.span) * 100,
          hasWeekend,
          pausedWidthPercent:
            (widthInPill / pillBounds.span) * 100 * pausedRatio,
        }
      })
      .filter((seg) => seg.widthPercent > 0)
  }, [timeline, pillBounds, viewStart, totalDays])

  // DEBUG: Log segments for debugging
  console.log(
    '[DEBUG segments]',
    pump.id.slice(-6),
    'segments:',
    segments.length,
    segments.map((s) => ({ stage: s.stage, width: s.widthPercent.toFixed(1) }))
  )

  // Draggable setup using first segment as reference
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unified-${pump.id}`,
    data: {
      type: 'CALENDAR_EVENT',
      pumpId: pump.id,
      pump,
    },
  })

  if (!pillBounds || segments.length === 0) return null

  const customerColor = getCustomerColor(pump.customer ?? '')
  const priorityBadge = pump.priority ? PRIORITY_BADGES[pump.priority] : null

  // Calculate final ship date from timeline
  const shipDate =
    timeline.length > 0 ? timeline[timeline.length - 1].end : null

  // Risk calculation
  const riskResult = calculateRisk(pump, shipDate ?? new Date())
  const riskClasses = getRiskClasses(riskResult.status)

  // Click handler for opening details
  const handleClick = () => {
    if (!isDragging && onClick) {
      // Create an event-like object for compatibility
      const event: CalendarStageEvent = {
        id: `unified-${pump.id}`,
        pumpId: pump.id,
        stage: timeline[0]?.stage ?? 'QUEUE',
        title: pump.model,
        subtitle: pump.po,
        customer: pump.customer,
        priority: pump.priority,
        promiseDate: pump.promiseDate ? new Date(pump.promiseDate) : undefined,
        week: 0,
        startDay: pillBounds.startIndex,
        span: pillBounds.span,
        row: rowIndex,
        startDate: timeline[0]?.start ?? viewStart,
        endDate: timeline[timeline.length - 1]?.end ?? viewStart,
        shipDate: shipDate ?? undefined,
      }
      onClick(event)
    }
  }

  // Risk indicator for tooltip
  const riskIndicator: Record<
    RiskStatus,
    { label: string; className: string }
  > = {
    late: {
      label: 'LATE',
      className: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
    },
    'at-risk': {
      label: 'AT RISK',
      className: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    },
    'on-track': {
      label: 'On Track',
      className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    },
  }

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-2">
        <span className="font-bold text-base">{pump.model}</span>
        <div className="flex items-center gap-1.5">
          {pump.priority &&
            pump.priority !== 'Normal' &&
            pump.priority !== 'Low' && (
              <span
                className={cn(
                  'text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold',
                  pump.priority === 'Urgent' && 'bg-rose-500/20 text-rose-300',
                  pump.priority === 'Rush' && 'bg-amber-500/20 text-amber-300',
                  pump.priority === 'High' && 'bg-orange-500/20 text-orange-300'
                )}
              >
                {pump.priority}
              </span>
            )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Customer:</span>
        </div>
        <div className="font-medium flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: customerColor }}
          />
          {pump.customer || 'Unknown'}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Box className="h-3 w-3" />
          <span>PO:</span>
        </div>
        <div className="font-medium mono">{pump.po}</div>

        {pump.promiseDate && (
          <>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flag className="h-3 w-3" />
              <span>Promise:</span>
            </div>
            <div
              className={cn(
                'font-medium',
                riskResult.status === 'late' && 'text-rose-400',
                riskResult.status === 'at-risk' && 'text-amber-400',
                riskResult.status === 'on-track' && 'text-emerald-400'
              )}
            >
              {new Date(pump.promiseDate).toLocaleDateString()}
              {riskResult.daysUntilPromise !== null && (
                <span className="ml-1 text-[10px] opacity-70">
                  (
                  {riskResult.daysUntilPromise >= 0
                    ? `${riskResult.daysUntilPromise}d left`
                    : `${Math.abs(riskResult.daysUntilPromise)}d overdue`}
                  )
                </span>
              )}
            </div>
          </>
        )}

        {shipDate && (
          <>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              <span>Est. Ship:</span>
            </div>
            <div className="font-medium text-emerald-400">
              {shipDate.toLocaleDateString()}
            </div>
          </>
        )}

        {/* Stage breakdown */}
        <div className="col-span-2 mt-2 pt-2 border-t border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Stages
          </div>
          <div className="flex flex-wrap gap-1">
            {segments.map((seg, i) => (
              <span
                key={i}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded',
                  STAGE_COLORS[seg.stage]
                )}
              >
                {STAGE_LABELS[seg.stage]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Risk status banner */}
      {riskResult.status !== 'on-track' && (
        <div
          className={cn(
            'mt-2 text-[10px] px-2 py-1 rounded border',
            riskIndicator[riskResult.status].className
          )}
        >
          <div className="font-bold">
            {riskIndicator[riskResult.status].label}
          </div>
          {riskResult.reasons.map((reason, i) => (
            <div key={i} className="opacity-80">
              {reason}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="absolute top-1/2 -translate-y-1/2 z-10"
      style={{
        left: pillBounds.startIndex * CELL_WIDTH,
        width: Math.max(20, pillBounds.span * CELL_WIDTH),
        height: 28,
      }}
      onClick={handleClick}
      data-testid="calendar-event"
      data-pump-id={pump.id}
      data-stage={pump.stage}
    >
      <Tooltip
        content={tooltipContent}
        side="top"
        className="min-w-[220px] z-50"
        triggerClassName="block w-full h-full"
      >
        <div
          className={cn(
            'relative flex h-full w-full overflow-hidden rounded-full border shadow-sm transition-all',
            'hover:shadow-md hover:scale-[1.02] hover:z-20',
            isDragging ? 'opacity-50' : 'opacity-100',
            'cursor-grab active:cursor-grabbing',
            riskClasses
          )}
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: customerColor,
          }}
        >
          {/* Priority Badge - top right corner */}
          {priorityBadge && (
            <div
              className={cn(
                'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold z-10',
                priorityBadge.bgClass
              )}
              title={`${pump.priority} Priority`}
            >
              {priorityBadge.label}
            </div>
          )}

          {/* Text Overlay - Absolute positioned over segments */}
          <div className="absolute inset-0 flex items-center px-3 z-10">
            <span className="truncate font-bold text-xs text-white drop-shadow-md leading-tight">
              {pump.model}
            </span>
            {pump.customer && (
              <span className="ml-2 truncate text-[10px] text-white/90 drop-shadow-md hidden sm:inline-block opacity-90">
                {pump.customer}
              </span>
            )}
          </div>

          {/* Stage segments */}
          {segments.map((seg, i) => (
            <div
              key={i}
              className={cn(
                'relative h-full flex-shrink-0',
                STAGE_COLORS[seg.stage],
                seg.hasWeekend && 'weekend-pattern'
              )}
              style={{
                width: `${seg.widthPercent}%`,
              }}
              data-testid="calendar-segment"
              data-stage={seg.stage}
            >
              {seg.pausedWidthPercent > 0 && (
                <div
                  className="absolute inset-y-0 right-0 bg-slate-950/35 border-l border-white/20"
                  style={{ width: `${seg.pausedWidthPercent}%` }}
                  data-testid="calendar-segment-paused"
                />
              )}
            </div>
          ))}
        </div>
      </Tooltip>
    </div>
  )
}
