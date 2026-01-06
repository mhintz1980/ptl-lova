import { cn } from '../../lib/utils'
import type { CalendarStageEvent } from '../../lib/projection-engine'
import { STAGE_COLORS, STAGE_LABELS } from '../../lib/stage-constants'
import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, AlertCircle, CalendarClock, User, Box } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'

interface CalendarEventProps {
  event: CalendarStageEvent
  onClick?: (event: CalendarStageEvent) => void
  onDoubleClick?: (event: CalendarStageEvent) => void
  isDragging?: boolean
  continuesLeft?: boolean
  continuesRight?: boolean
  linearMode?: boolean
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
  const status = idleDays > 6 ? 'danger' : idleDays > 3 ? 'warning' : 'ok'
  const stageColorClass = STAGE_COLORS[event.stage] ?? STAGE_COLORS['QUEUE']
  const StatusIcon = status === 'danger' ? AlertCircle : status === 'warning' ? AlertTriangle : null
  
  // Pill styling logic
  const roundedClass = linearMode ? 'rounded-full' : (
    cn(
      continuesLeft ? 'rounded-l-none border-l-0' : 'rounded-l-md',
      continuesRight ? 'rounded-r-none border-r-0' : 'rounded-r-md'
    )
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
        'overflow-hidden'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-testid="calendar-event"
    >
      <div className="flex items-center gap-1.5 w-full">
        {StatusIcon && (
          <StatusIcon 
            className={cn(
              "h-3 w-3 flex-shrink-0 animate-pulse", 
              status === 'danger' ? 'text-rose-600' : 'text-amber-600'
            )} 
          />
        )}
        <span className="truncate font-bold leading-tight flex-1">
          {event.title}
        </span>
      </div>
      
      {!linearMode && (
         <div className="mt-0.5 truncate text-[10px] opacity-70">
          {event.customer ?? event.subtitle}
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
      >
        <div className="font-bold truncate">{event.title}</div>
      </div>
    )
  }

  // Tooltip Content
  const tooltipContent = (
     <div className="space-y-2 select-none">
        <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-2">
            <span className="font-bold text-base">{event.title}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70 bg-primary/20 px-1.5 rounded-sm">
                {stageLabel}
            </span>
        </div>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Customer:</span>
            </div>
            <div className="font-medium">{event.customer || "Unknown"}</div>

             <div className="flex items-center gap-1.5 text-muted-foreground">
                <Box className="h-3 w-3" />
                <span>PO:</span>
            </div>
            <div className="font-medium mono">{event.subtitle}</div>

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
        
        {status !== 'ok' && (
             <div className={cn(
                 "mt-2 text-[10px] px-2 py-1 rounded border",
                 status === 'danger' ? "bg-rose-500/10 border-rose-500/30 text-rose-200" : "bg-amber-500/10 border-amber-500/30 text-amber-200"
             )}>
                 {status === 'danger' ? "Blocker: High Idle Time (>6 days)" : "Warning: Idle Time (>3 days)"}
             </div>
        )}
     </div>
  )

  return (
    <div
    ref={setNodeRef}
    style={
      !linearMode ? {
        gridColumnStart: Math.floor(event.startDay) + 1,
        gridColumnEnd: `span ${Math.ceil(event.startDay + event.span) - Math.floor(event.startDay)}`,
        gridRowStart: event.row + 1,
        marginLeft: `${((event.startDay % 1) / (Math.ceil(event.startDay + event.span) - Math.floor(event.startDay))) * 100}%`,
        width: `${(event.span / (Math.ceil(event.startDay + event.span) - Math.floor(event.startDay))) * 100}%`,
      } : undefined
    }
    {...attributes}
    {...listeners}
    className="h-full w-full"
    >
      <Tooltip content={tooltipContent} side="top" className="min-w-[200px] z-50">
        {PillContent}
      </Tooltip>
    </div>
  )
}
