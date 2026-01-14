// src/components/scheduling/MainCalendarGrid.tsx
import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { addDays, format, startOfDay, startOfWeek, isWeekend } from 'date-fns'
import { cn } from '../../lib/utils'
import type { Pump, Stage } from '../../types'
import { UnifiedJobPill } from './UnifiedJobPill'
import { SwimlaneGroup } from './SwimlaneGroup'
import type {
  CalendarStageEvent,
  StageBlock,
} from '../../lib/projection-engine'
import { projectCapacityAwareTimelines } from '../../lib/projection-engine'
import { useApp } from '../../store'
import { calculateRisk } from '../../lib/riskCalculator'

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

// Helper to get risk status for grouping
function getRiskGroup(
  pump: Pump,
  shipDate: Date | null
): 'late' | 'at-risk' | 'on-track' {
  const result = calculateRisk(pump, shipDate ?? new Date())
  return result.status
}

interface GroupedPumps {
  [groupId: string]: { pump: Pump; timeline: StageBlock[] }[]
}

export function MainCalendarGrid({
  pumps,
  onEventClick,
  onEventDoubleClick: _onEventDoubleClick,
  visibleStages = [],
}: MainCalendarGridProps) {
  // Use proper hook pattern instead of getState() anti-pattern
  const { getModelLeadTimes, capacityConfig } = useApp()
  const scheduleGroupBy = useApp((state) => state.scheduleGroupBy)
  const scheduleSortBy = useApp((state) => state.scheduleSortBy)

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

  // Build timelines for all pumps
  const pumpTimelines = useMemo(() => {
    // Use the capacity-aware projection engine
    const timelinesMap = projectCapacityAwareTimelines(
      pumps,
      capacityConfig,
      getModelLeadTimes
    )

    return pumps
      .map((pump) => {
        const timeline = timelinesMap[pump.id]
        if (!timeline || !timeline.length) return null

        // Apply stage filter if set
        let filteredTimeline = timeline
        if (stageFilter.size > 0) {
          filteredTimeline = timeline.filter((block) =>
            stageFilter.has(block.stage)
          )
        }
        if (!filteredTimeline.length) return null

        return { pump, timeline: filteredTimeline }
      })
      .filter((item): item is { pump: Pump; timeline: StageBlock[] } =>
        Boolean(item)
      )
  }, [pumps, capacityConfig, getModelLeadTimes, stageFilter])

  // Group pumps by selected criteria
  const groupedPumps = useMemo((): GroupedPumps => {
    const groups: GroupedPumps = {}

    pumpTimelines.forEach(({ pump, timeline }) => {
      let groupId: string
      switch (scheduleGroupBy) {
        case 'model':
          groupId = pump.model
          break
        case 'customer':
          groupId = pump.customer || 'Unknown'
          break
        case 'po':
          groupId = pump.po
          break
        case 'risk':
          const shipDate =
            timeline.length > 0 ? timeline[timeline.length - 1].end : null
          groupId = getRiskGroup(pump, shipDate)
          break
        default:
          groupId = pump.model
      }

      if (!groups[groupId]) {
        groups[groupId] = []
      }
      groups[groupId].push({ pump, timeline })
    })

    return groups
  }, [pumpTimelines, scheduleGroupBy])

  // Sort pumps within each group
  const sortedGroups = useMemo(() => {
    const result: {
      groupId: string
      items: { pump: Pump; timeline: StageBlock[] }[]
    }[] = []

    Object.entries(groupedPumps).forEach(([groupId, items]) => {
      const sorted = [...items].sort((a, b) => {
        switch (scheduleSortBy) {
          case 'customer':
            return (a.pump.customer || '').localeCompare(b.pump.customer || '')
          case 'model':
            return a.pump.model.localeCompare(b.pump.model)
          case 'po':
            return a.pump.po.localeCompare(b.pump.po)
          case 'startDate':
          default:
            const aStart = a.timeline[0]?.start.getTime() ?? 0
            const bStart = b.timeline[0]?.start.getTime() ?? 0
            return aStart - bStart
        }
      })
      result.push({ groupId, items: sorted })
    })

    // Sort groups alphabetically, but put risk groups in order: late, at-risk, on-track
    return result.sort((a, b) => {
      if (scheduleGroupBy === 'risk') {
        const order = { late: 0, 'at-risk': 1, 'on-track': 2 }
        return (
          (order[a.groupId as keyof typeof order] ?? 3) -
          (order[b.groupId as keyof typeof order] ?? 3)
        )
      }
      return a.groupId.localeCompare(b.groupId)
    })
  }, [groupedPumps, scheduleSortBy, scheduleGroupBy])

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

  // Track row index across all groups for correct positioning
  let globalRowIndex = 0

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

            {/* Content Rows - Grouped into Swimlanes */}
            <div className="relative z-10 pt-2 pb-10">
              {sortedGroups.map(({ groupId, items }) => {
                const startRowIndex = globalRowIndex
                globalRowIndex += items.length

                return (
                  <SwimlaneGroup
                    key={groupId}
                    id={groupId}
                    label={
                      scheduleGroupBy === 'risk'
                        ? groupId.toUpperCase()
                        : groupId
                    }
                    count={items.length}
                  >
                    <div>
                      {items.map(({ pump, timeline }, localIdx) => (
                        <div
                          key={pump.id}
                          className={cn(
                            'relative w-full border-b border-border/10 hover:bg-muted/5 transition-colors group/row',
                            // Alternating shade for visual grouping
                            localIdx % 2 === 1 && 'bg-muted/5'
                          )}
                          style={{ height: ROW_HEIGHT }}
                        >
                          <UnifiedJobPill
                            pump={pump}
                            timeline={timeline}
                            viewStart={viewStart}
                            totalDays={TOTAL_DAYS}
                            onClick={onEventClick}
                            rowIndex={startRowIndex + localIdx}
                          />
                        </div>
                      ))}
                    </div>
                  </SwimlaneGroup>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
