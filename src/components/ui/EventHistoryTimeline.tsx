// src/components/ui/EventHistoryTimeline.tsx
import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ArrowRight, Pause, Play, Clock } from 'lucide-react'
import { Badge } from './Badge'
import { ScrollArea } from './ScrollArea'
import { eventStore } from '../../infrastructure/events/EventStore'
import { STAGE_LABELS } from '../../lib/stage-constants'
import { cn } from '../../lib/utils'
import type { DomainEvent } from '../../domain/production/events/DomainEvent'
import type { PumpStageMoved } from '../../domain/production/events/PumpStageMoved'
import type { PumpPaused } from '../../domain/production/events/PumpPaused'
import type { PumpResumed } from '../../domain/production/events/PumpResumed'

interface EventHistoryTimelineProps {
  pumpId: string
}

type TimelineEvent = PumpStageMoved | PumpPaused | PumpResumed

// Event type color schemes for consistent visual coding
const EVENT_COLORS = {
  PumpStageMoved: {
    icon: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  PumpPaused: {
    icon: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  PumpResumed: {
    icon: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
} as const

export function EventHistoryTimeline({ pumpId }: EventHistoryTimelineProps) {
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTimestamp] = useState(Date.now())

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const allEvents = await eventStore.getEvents(pumpId)
        // Filter to only relevant event types and sort newest first
        const relevantEvents = allEvents.filter(
          (e) =>
            e.eventType === 'PumpStageMoved' ||
            e.eventType === 'PumpPaused' ||
            e.eventType === 'PumpResumed'
        )
        const sorted = relevantEvents.sort(
          (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
        )
        setEvents(sorted)
      } catch (error) {
        console.error('Failed to fetch pump events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [pumpId])

  // Update relative timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now())
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-8 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-label="Loading event history"
      >
        <Clock className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Loading events...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
        role="status"
        aria-label="No events available"
      >
        <Clock
          className="mb-2 h-8 w-8 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">No events yet</p>
        <p className="text-xs text-muted-foreground/70">
          Events will appear here as the pump moves through stages
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <ol className="space-y-4" role="list" aria-label="Event history timeline">
        {events.map((event, index) => (
          <TimelineEventItem
            key={`${event.eventType}-${event.occurredAt.getTime()}-${index}`}
            event={event as TimelineEvent}
            isLast={index === events.length - 1}
          />
        ))}
      </ol>
    </ScrollArea>
  )
}

interface TimelineEventItemProps {
  event: TimelineEvent
  isLast: boolean
}

function TimelineEventItem({ event, isLast }: TimelineEventItemProps) {
  const formattedTime = format(event.occurredAt, 'MMM d, yyyy h:mm a')
  const relativeTime = formatDistanceToNow(event.occurredAt, {
    addSuffix: true,
  })
  const colors = EVENT_COLORS[event.eventType]

  // Get event type label for accessibility
  const eventTypeLabel =
    event.eventType === 'PumpStageMoved'
      ? 'Stage moved'
      : event.eventType === 'PumpPaused'
        ? 'Pump paused'
        : 'Pump resumed'

  return (
    <li
      className="relative flex gap-3 group"
      role="listitem"
      aria-label={`${eventTypeLabel} ${relativeTime}`}
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div
          className="absolute left-[11px] top-8 h-full w-[2px] bg-gradient-to-b from-border/50 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Event icon with color-coded styling */}
      <div
        className={cn(
          'relative z-10 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
          colors.bg,
          colors.border,
          'group-hover:shadow-md',
          `group-hover:${colors.glow}`,
          'group-hover:scale-110'
        )}
        aria-hidden="true"
      >
        {event.eventType === 'PumpStageMoved' && (
          <ArrowRight className={cn('h-3 w-3', colors.icon)} />
        )}
        {event.eventType === 'PumpPaused' && (
          <Pause className={cn('h-3 w-3', colors.icon)} />
        )}
        {event.eventType === 'PumpResumed' && (
          <Play className={cn('h-3 w-3', colors.icon)} />
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-2 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <EventContent event={event} />
          </div>
          <time
            className="text-xs text-muted-foreground font-medium whitespace-nowrap sm:text-right"
            dateTime={event.occurredAt.toISOString()}
            title={formattedTime}
          >
            {relativeTime}
          </time>
        </div>
      </div>
    </li>
  )
}

interface EventContentProps {
  event: TimelineEvent
}

function EventContent({ event }: EventContentProps) {
  if (event.eventType === 'PumpStageMoved') {
    const fromLabel = event.fromStage
      ? (STAGE_LABELS[event.fromStage] ?? event.fromStage)
      : 'New'
    const toLabel = STAGE_LABELS[event.toStage] ?? event.toStage

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" className="text-xs font-semibold">
            Stage Move
          </Badge>
        </div>
        <p className="text-sm leading-relaxed">
          <span className="text-muted-foreground">{fromLabel}</span>
          <ArrowRight
            className="mx-1.5 inline h-3.5 w-3.5 text-blue-400"
            aria-hidden="true"
          />
          <span className="font-semibold text-foreground">{toLabel}</span>
        </p>
      </div>
    )
  }

  if (event.eventType === 'PumpPaused') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="warning" className="text-xs font-semibold">
            Paused
          </Badge>
          {event.reason === 'auto' && (
            <span
              className="text-xs text-muted-foreground italic"
              aria-label="Automatically paused"
            >
              (automatic)
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paused in{' '}
          <span className="font-medium">
            {STAGE_LABELS[event.stage] ?? event.stage}
          </span>
        </p>
      </div>
    )
  }

  if (event.eventType === 'PumpResumed') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="success" className="text-xs font-semibold">
            Resumed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Resumed in{' '}
          <span className="font-medium">
            {STAGE_LABELS[event.stage] ?? event.stage}
          </span>
          {event.pausedDays > 0 && (
            <span className="ml-1">
              (paused <span className="font-medium">{event.pausedDays}</span>{' '}
              {event.pausedDays === 1 ? 'day' : 'days'})
            </span>
          )}
        </p>
      </div>
    )
  }

  return null
}
