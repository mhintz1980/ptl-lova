// src/components/scheduling/MainCalendarGrid.tsx
import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { addDays, format, startOfDay, startOfWeek, isWeekend } from 'date-fns'
import { cn } from '../../lib/utils'
import type { Pump, Stage } from '../../types'
import { CalendarEvent } from './CalendarEvent'
import {
  type CalendarStageEvent,
  type StageBlock,
  projectCapacityAwareTimelines,
} from '../../lib/projection-engine'
import { useApp } from '../../store'

interface MainCalendarGridProps {
  pumps: Pump[]
  onEventClick?: (event: CalendarStageEvent) => void
  onEventDoubleClick?: (event: CalendarStageEvent) => void
  visibleStages?: Stage[]
}

const TOTAL_DAYS = 42 // 6 weeks
const CELL_WIDTH = 50 // Fixed width for consistent alignment
const ROW_HEIGHT = 44 // Height for row alignment

const HOLIDAYS = [
  '2025-01-01', // New Year
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
]

function isHoliday(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  return HOLIDAYS.includes(dateStr)
}

function projectSegmentsToTimeline(
  blocks: StageBlock[],
  viewStart: Date,
  daysToShow: number
): {
  stage: Stage
  startIndex: number
  span: number
}[] {
  const viewEnd = addDays(viewStart, daysToShow)
  const MS_PER_DAY = 24 * 60 * 60 * 1000

  return blocks.reduce<{ stage: Stage; startIndex: number; span: number }[]>(
    (acc, block) => {
      if (block.end <= viewStart || block.start >= viewEnd) return acc

      const relativeStart =
        (block.start.getTime() - viewStart.getTime()) / MS_PER_DAY
      const relativeEnd =
        (block.end.getTime() - viewStart.getTime()) / MS_PER_DAY

      const startIndex = Math.max(0, relativeStart)
      const endIndex = Math.min(daysToShow, relativeEnd)
      const span = Math.max(1 / 24, endIndex - startIndex)

      acc.push({
        stage: block.stage,
        startIndex,
        span,
      })
      return acc
    },
    []
  )
}

function FlowConnectorLayer({
  events,
  rowHeight,
  cellWidth,
}: {
  events: CalendarStageEvent[]
  rowHeight: number
  cellWidth: number
}) {
  // Group events by pumpId
  const pumpGroups = useMemo(() => {
    const groups: Record<string, CalendarStageEvent[]> = {}
    events.forEach((ev) => {
      if (!groups[ev.pumpId]) groups[ev.pumpId] = []
      groups[ev.pumpId].push(ev)
    })
    return groups
  }, [events])

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      style={{ top: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(209 213 219)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(156 163 175)" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {Object.values(pumpGroups).map((groupPumps) => {
        // Sort by start time
        const sorted = [...groupPumps].sort((a, b) => a.startDay - b.startDay)
        return sorted.map((ev, i) => {
          if (i === sorted.length - 1) return null
          const nextEv = sorted[i + 1]

          // Only connect if they are on the same row (should always be true for linear view rows we built)
          if (ev.row !== nextEv.row) return null

          const startX = (ev.startDay + ev.span) * cellWidth
          const endX = nextEv.startDay * cellWidth
          const y = ev.row * rowHeight + rowHeight / 2 // Centered vertical alignment relative to row

          // Use a simple cubic bezier for smooth connection
          // Control points: pull out horizontally from start and in horizontally to end
          const controlDist = Math.max(20, (endX - startX) / 2)

          return (
            <path
              key={`conn-${ev.id}-${nextEv.id}`}
              d={`M ${startX} ${y} C ${startX + controlDist} ${y}, ${
                endX - controlDist
              } ${y}, ${endX} ${y}`}
              stroke="url(#flowGradient)"
              strokeWidth="2"
              fill="none"
              className="transition-all duration-300"
            />
          )
        })
      })}
    </svg>
  )
}

export function MainCalendarGrid({
  pumps,
  onEventClick,
  onEventDoubleClick,
  visibleStages = [],
}: MainCalendarGridProps) {
  const { getModelLeadTimes } = useApp.getState()

  const today = useMemo(() => startOfDay(new Date()), [])
  // Start view from this week's Monday
  const viewStart = useMemo(
    () => startOfDay(startOfWeek(today, { weekStartsOn: 1 })),
    [today]
  )

  const stageFilter = useMemo(
    () => new Set(visibleStages ?? []),
    [visibleStages]
  )

  const pumpTimelines = useMemo(() => {
    const { capacityConfig } = useApp.getState()
    const timelinesMap = projectCapacityAwareTimelines(
      pumps,
      capacityConfig,
      getModelLeadTimes
    )

    return pumps
      .map((pump) => {
        const timeline = timelinesMap[pump.id]
        if (!timeline || !timeline.length) return null
        return { pump, timeline }
      })
      .filter((item): item is { pump: Pump; timeline: StageBlock[] } =>
        Boolean(item)
      )
      .sort((a, b) => {
        const aStart = a.timeline[0]?.start.getTime() ?? 0
        const bStart = b.timeline[0]?.start.getTime() ?? 0
        return aStart - bStart
      })
  }, [pumps, getModelLeadTimes])

  const allEvents: CalendarStageEvent[] = []

  const DroppableCell = ({
    date,
    dayIndex,
  }: {
    date: Date
    dayIndex: number
  }) => {
    const dateId = format(date, 'yyyy-MM-dd')
    const { isOver, setNodeRef } = useDroppable({
      id: dateId,
      data: { date: dateId },
    })

    const isToday = date.toDateString() === today.toDateString()
    const isWknd = isWeekend(date)
    const isHol = isHoliday(date)

    return (
      <div
        ref={setNodeRef}
        className={cn(
          'absolute top-0 bottom-0 border-r border-border/30 transition-colors',
          isToday && 'bg-primary/5',
          (isWknd || isHol) && 'bg-muted/20',
          isOver && 'bg-primary/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.2)]'
        )}
        style={{
          left: dayIndex * CELL_WIDTH,
          width: CELL_WIDTH,
        }}
        data-testid={`calendar-cell-${dateId}`}
      />
    )
  }

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    addDays(viewStart, i)
  )

  return (
    <div
      className="flex-1 overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-inner flex flex-col"
      data-testid="calendar-grid"
    >
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">
        <div
          className="relative min-w-max"
          style={{ width: TOTAL_DAYS * CELL_WIDTH }}
        >
          {/* Header Row */}
          <div className="sticky top-0 z-20 flex h-[30px] border-b border-border/60 bg-background/90 backdrop-blur">
            {days.map((date, i) => {
              const isToday = date.toDateString() === today.toDateString()
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-center border-r border-border/30 text-[10px] uppercase tracking-wider',
                    isToday
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground'
                  )}
                  style={{ width: CELL_WIDTH, flexShrink: 0 }}
                >
                  {format(date, 'MMM d')}
                </div>
              )
            })}
          </div>

          {/* Grid Body */}
          <div className="relative min-h-[500px]">
            {/* Background Grid Columns */}
            {days.map((date, i) => (
              <DroppableCell key={i} date={date} dayIndex={i} />
            ))}

            {/* Content Rows - Calculate events first so we can pass them to SVG layer */}
            <div className="relative z-10 pt-2 pb-10">
              {pumpTimelines.map(({ pump, timeline }, rowIdx) => {
                let segments = projectSegmentsToTimeline(
                  timeline,
                  viewStart,
                  TOTAL_DAYS
                )

                if (stageFilter.size) {
                  segments = segments.filter((s) => stageFilter.has(s.stage))
                }
                if (!segments.length) return null

                return (
                  <div
                    key={pump.id}
                    className="relative w-full border-b border-border/10 hover:bg-muted/5 transition-colors group/row"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Row Hover Context: Keep row highlighted */}
                    {segments.map((segment, segIdx) => {
                      const event: CalendarStageEvent = {
                        id: `${pump.id}-${segment.stage}-${segIdx}`,
                        pumpId: pump.id,
                        stage: segment.stage,
                        title: pump.model,
                        subtitle: pump.po,
                        week: 0, // Not used in linear
                        startDay: segment.startIndex,
                        span: segment.span,
                        row: rowIdx,
                        startDate: addDays(viewStart, segment.startIndex),
                        endDate: addDays(
                          viewStart,
                          segment.startIndex + segment.span
                        ),
                        shipDate: pump.forecastEnd
                          ? new Date(pump.forecastEnd)
                          : undefined,
                      }

                      // Side-effect: Push to array for SVG layer
                      // Note: This is safe in render because we clear allEvents on each render before this map
                      allEvents.push(event)

                      return (
                        <div
                          key={event.id}
                          className="absolute top-1/2 -translate-y-1/2 z-10 pl-1 pr-1"
                          style={{
                            left: segment.startIndex * CELL_WIDTH,
                            width: Math.max(20, segment.span * CELL_WIDTH),
                            height: 28,
                          }}
                        >
                          <CalendarEvent
                            event={event}
                            onClick={onEventClick}
                            onDoubleClick={onEventDoubleClick}
                            linearMode
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* SVG Connector Layer - Rendered AFTER logic but strictly absolute positioned */}
            <FlowConnectorLayer
              events={allEvents}
              rowHeight={ROW_HEIGHT}
              cellWidth={CELL_WIDTH}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
