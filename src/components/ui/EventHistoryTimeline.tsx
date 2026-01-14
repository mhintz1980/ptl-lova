// src/components/ui/EventHistoryTimeline.tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowRight, Pause, Play, Clock } from 'lucide-react'
import { Badge } from './Badge'
import { ScrollArea } from './ScrollArea'
import { eventStore } from '../../infrastructure/events/EventStore'
import { STAGE_LABELS } from '../../lib/stage-constants'
import type { DomainEvent } from '../../domain/production/events/DomainEvent'
import type { PumpStageMoved } from '../../domain/production/events/PumpStageMoved'
import type { PumpPaused } from '../../domain/production/events/PumpPaused'
import type { PumpResumed } from '../../domain/production/events/PumpResumed'

interface EventHistoryTimelineProps {
  pumpId: string
}

type TimelineEvent = PumpStageMoved | PumpPaused | PumpResumed

export function EventHistoryTimeline({ pumpId }: EventHistoryTimelineProps) {
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Clock className="mr-2 h-4 w-4 animate-spin" />
        Loading events...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No events yet</p>
        <p className="text-xs text-muted-foreground/70">
          Events will appear here as the pump moves through stages
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {events.map((event, index) => (
          <TimelineEventItem
            key={`${event.eventType}-${event.occurredAt.getTime()}-${index}`}
            event={event as TimelineEvent}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface TimelineEventItemProps {
  event: TimelineEvent
  isLast: boolean
}

function TimelineEventItem({ event, isLast }: TimelineEventItemProps) {
  const formattedTime = format(event.occurredAt, 'MMM d, yyyy h:mm a')

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 h-full w-[2px] bg-border/50" />
      )}

      {/* Event icon */}
      <div className="relative z-10 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-card">
        {event.eventType === 'PumpStageMoved' && (
          <ArrowRight className="h-3 w-3 text-blue-500" />
        )}
        {event.eventType === 'PumpPaused' && (
          <Pause className="h-3 w-3 text-yellow-500" />
        )}
        {event.eventType === 'PumpResumed' && (
          <Play className="h-3 w-3 text-green-500" />
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <EventContent event={event} />
          </div>
          <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>
            {formattedTime}
          </time>
        </div>
      </div>
    </div>
  )
}

interface EventContentProps {
  event: TimelineEvent
}

function EventContent({ event }: EventContentProps) {
  if (event.eventType === 'PumpStageMoved') {
    const fromLabel = event.fromStage
      ? STAGE_LABELS[event.fromStage] ?? event.fromStage
      : 'New'
    const toLabel = STAGE_LABELS[event.toStage] ?? event.toStage

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs">
            Stage Move
          </Badge>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{fromLabel}</span>
          <ArrowRight className="mx-1 inline h-3 w-3" />
          <span className="font-medium">{toLabel}</span>
        </p>
      </div>
    )
  }

  if (event.eventType === 'PumpPaused') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-xs">
            Paused
          </Badge>
          {event.reason === 'auto' && (
            <span className="text-xs text-muted-foreground">(automatic)</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Paused in {STAGE_LABELS[event.stage] ?? event.stage}
        </p>
      </div>
    )
  }

  if (event.eventType === 'PumpResumed') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs">
            Resumed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Resumed in {STAGE_LABELS[event.stage] ?? event.stage}
          {event.pausedDays > 0 && (
            <span className="ml-1">
              (paused {event.pausedDays} {event.pausedDays === 1 ? 'day' : 'days'})
            </span>
          )}
        </p>
      </div>
    )
  }

  return null
}
