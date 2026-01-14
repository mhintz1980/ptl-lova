import { cn } from '../../lib/utils'
import type { CalendarStageEvent } from '../../lib/projection-engine'
import { STAGE_COLORS, STAGE_LABELS } from '../../lib/stage-constants'
import { useDraggable } from '@dnd-kit/core'
import {
  AlertTriangle,
  AlertCircle,
  CalendarClock,
  User,
  Box,
  Flag,
} from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { getCustomerColor } from '../../lib/customerColors'
import {
  calculateRisk,
  getRiskClasses,
  type RiskStatus,
} from '../../lib/riskCalculator'
import type { Pump } from '../../types'

interface CalendarEventProps {
  event: CalendarStageEvent
  onClick?: (event: CalendarStageEvent) => void
  onDoubleClick?: (event: CalendarStageEvent) => void
  isDragging?: boolean
  continuesLeft?: boolean
  continuesRight?: boolean
  linearMode?: boolean
}

// Priority badge configuration
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

export function CalendarEvent({
  event,
  onClick,
  onDoubleClick,
  isDragging = false,
  continuesLeft = false,
  continuesRight = false,
  linearMode = false,
}: CalendarEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isDraggable,
  } = useDraggable({
    id: event.id,
    data: {
      type: 'CALENDAR_EVENT',
      event,
      pumpId: event.pumpId,
    },
  })

  // Hook must be called unconditionally
  const stageLabel = STAGE_LABELS[event.stage] ?? event.stage
  const idleDays = event.idleDays ?? 0
  const idleStatus = idleDays > 6 ? 'danger' : idleDays > 3 ? 'warning' : 'ok'
  const stageColorClass = STAGE_COLORS[event.stage] ?? STAGE_COLORS['QUEUE']
  const StatusIcon =
    idleStatus === 'danger'
      ? AlertCircle
      : idleStatus === 'warning'
      ? AlertTriangle
      : null

  // Customer color for left stripe
  const customerColor = getCustomerColor(event.customer ?? '')

  // Calculate risk status for promise date based styling
  const riskResult = calculateRisk(
    {
      id: event.pumpId,
      promiseDate: event.promiseDate?.toISOString(),
      priority: event.priority ?? 'Normal',
    } as Pump,
    event.endDate
  )
  const riskClasses = getRiskClasses(riskResult.status)

  // Priority badge
  const priorityBadge = event.priority ? PRIORITY_BADGES[event.priority] : null

  // Segment position - consolidated labels
  // First segment shows full info, subsequent segments show stage abbreviation only
  const isFirstSegment = event.isFirstSegment !== false

  // Stage abbreviations for non-first segments
  const stageAbbrev: Record<string, string> = {
    QUEUE: 'Q',
    FABRICATION: 'FAB',
    STAGED_FOR_POWDER: 'STG',
    POWDER_COAT: 'PC',
    ASSEMBLY: 'ASM',
    SHIP: 'SHP',
    CLOSED: '✓',
  }

  // Show model name only on first segment
  const showModelName = isFirstSegment

  // Show customer only on first segment AND wide span
  const showCustomer = isFirstSegment && event.span >= 2 && event.customer

  // Priority badge only on first segment
  const showPriorityBadge = isFirstSegment && priorityBadge

  // Pill styling logic
  const roundedClass = linearMode
    ? 'rounded-full'
    : cn(
        continuesLeft ? 'rounded-l-none border-l-0' : 'rounded-l-md',
        continuesRight ? 'rounded-r-none border-r-0' : 'rounded-r-md'
      )

  // Use single click to open details - better UX than double-click
  const handleClick = () => {
    // Only trigger if not dragging
    if (!isDraggable) {
      onClick?.(event)
    }
  }

  const handleDoubleClick = () => {
    onDoubleClick?.(event)
  }

  // Define the core content of the pill so we can reuse it or wrap it
  const PillContent = (
    <div
      className={cn(
        'group relative flex h-full w-full flex-col justify-center border px-2 py-0.5 text-xs shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:z-20',
        stageColorClass,
        isDraggable ? 'opacity-50' : 'opacity-100',
        'cursor-grab active:cursor-grabbing',
        roundedClass,
        'overflow-hidden',
        riskClasses
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: customerColor,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-testid="calendar-event"
      data-risk-status={riskResult.status}
      data-priority={event.priority}
      data-segment-index={event.segmentIndex}
    >
      {/* Priority Badge - top right corner (first segment only) */}
      {showPriorityBadge && (
        <div
          className={cn(
            'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold z-10',
            priorityBadge!.bgClass
          )}
          title={`${event.priority} Priority`}
        >
          {priorityBadge!.label}
        </div>
      )}

      <div className="flex items-center gap-1.5 w-full pr-3">
        {StatusIcon && (
          <StatusIcon
            className={cn(
              'h-3 w-3 flex-shrink-0 animate-pulse',
              idleStatus === 'danger' ? 'text-rose-600' : 'text-amber-600'
            )}
          />
        )}
        <span className="truncate font-bold leading-tight flex-1">
          {showModelName ? event.title : stageAbbrev[event.stage] || stageLabel}
        </span>
      </div>

      {/* Customer name on wide pills (first segment only) */}
      {showCustomer && (
        <div className="mt-0.5 truncate text-[10px] opacity-70">
          {event.customer}
        </div>
      )}
    </div>
  )

  // If dragging, render a simplified version WITHOUT tooltip (portal issue avoidance)
  if (isDragging) {
    return (
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center border px-2 text-xs shadow-sm transition-all',
          stageColorClass,
          roundedClass,
          'cursor-grabbing opacity-50 ring-2 ring-primary ring-offset-2'
        )}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: customerColor,
        }}
      >
        <div className="font-bold truncate">{event.title}</div>
      </div>
    )
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

  // Tooltip Content
  const tooltipContent = (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-2">
        <span className="font-bold text-base">{event.title}</span>
        <div className="flex items-center gap-1.5">
          {event.priority &&
            event.priority !== 'Normal' &&
            event.priority !== 'Low' && (
              <span
                className={cn(
                  'text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold',
                  event.priority === 'Urgent' && 'bg-rose-500/20 text-rose-300',
                  event.priority === 'Rush' && 'bg-amber-500/20 text-amber-300',
                  event.priority === 'High' &&
                    'bg-orange-500/20 text-orange-300'
                )}
              >
                {event.priority}
              </span>
            )}
          <span className="text-[10px] uppercase tracking-wider opacity-70 bg-primary/20 px-1.5 rounded-sm">
            {stageLabel}
          </span>
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
          {event.customer || 'Unknown'}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Box className="h-3 w-3" />
          <span>PO:</span>
        </div>
        <div className="font-medium mono">{event.subtitle}</div>

        {event.promiseDate && (
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
              {event.promiseDate.toLocaleDateString()}
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

        {event.endDate && (
          <>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              <span>Est. Comp:</span>
            </div>
            <div className="font-medium text-emerald-400">
              {event.endDate.toLocaleDateString()}
            </div>
          </>
        )}
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

      {/* Idle time warning (separate from promise-based risk) */}
      {idleStatus !== 'ok' && (
        <div
          className={cn(
            'text-[10px] px-2 py-1 rounded border',
            idleStatus === 'danger'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          )}
        >
          {idleStatus === 'danger'
            ? 'Blocker: High Idle Time (>6 days)'
            : 'Warning: Idle Time (>3 days)'}
        </div>
      )}
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      style={
        !linearMode
          ? {
              gridColumnStart: Math.floor(event.startDay) + 1,
              gridColumnEnd: `span ${
                Math.ceil(event.startDay + event.span) -
                Math.floor(event.startDay)
              }`,
              gridRowStart: event.row + 1,
              marginLeft: `${
                ((event.startDay % 1) /
                  (Math.ceil(event.startDay + event.span) -
                    Math.floor(event.startDay))) *
                100
              }%`,
              width: `${
                (event.span /
                  (Math.ceil(event.startDay + event.span) -
                    Math.floor(event.startDay))) *
                100
              }%`,
            }
          : undefined
      }
      {...attributes}
      {...listeners}
      className="h-full w-full"
    >
      <Tooltip
        content={tooltipContent}
        side="top"
        className="min-w-[220px] z-50"
      >
        {PillContent}
      </Tooltip>
    </div>
  )
}
