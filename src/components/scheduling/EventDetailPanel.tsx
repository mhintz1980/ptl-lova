// src/components/scheduling/EventDetailPanel.tsx
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import type { CalendarStageEvent } from "../../lib/schedule";
import { STAGE_LABELS, STAGE_COLORS } from "../../lib/stage-constants";

interface EventDetailPanelProps {
  event: CalendarStageEvent | null;
  onClose: () => void;
}

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  if (!event) return null;

  const stageLabel = STAGE_LABELS[event.stage] ?? event.stage;
  const dateRange = `${format(event.startDate, "MMM d")} → ${format(
    event.endDate,
    "MMM d"
  )}`;

  return (
    <div
      className="flex w-[320px] flex-col justify-between border-l border-border/70 bg-card/90 px-5 py-6 text-foreground shadow-xl"
      data-testid="event-detail-panel"
    >
      <div>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p className="text-sm text-foreground/70">PO {event.subtitle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="header-button h-8 w-8 rounded-full border border-border/60 bg-card/80"
            onClick={onClose}
            aria-label="Close event details"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 text-sm text-foreground/80">
          {event.customer && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Customer
              </div>
              <p className="text-base">{event.customer}</p>
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Stage
            </div>
            <Badge
              variant="outline"
              className={cn(
                STAGE_COLORS[event.stage] ?? "stage-color stage-color-unscheduled",
                "border-none text-xs font-semibold"
              )}
            >
              {stageLabel}
            </Badge>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Window
            </div>
            <p className="font-medium">{dateRange}</p>
          </div>

          {event.priority && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Priority
              </div>
              <Badge className="border-none bg-muted/80 text-foreground">
                {event.priority}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          variant="ghost"
          className="header-button rounded-full border border-border/60 bg-card/80 px-4"
        >
          Adjust
        </Button>
        <Button variant="destructive" className="rounded-full">
          Clear
        </Button>
      </div>
    </div>
  );
}
