import { cn } from "../../lib/utils";
import type { CalendarStageEvent } from "../../lib/schedule";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import { useDraggable } from "@dnd-kit/core";

interface CalendarEventProps {
  event: CalendarStageEvent;
  onClick?: (event: CalendarStageEvent) => void;
  onDoubleClick?: (event: CalendarStageEvent) => void;
  isDragging?: boolean;
}

export function CalendarEvent({ event, onClick, onDoubleClick, isDragging = false }: CalendarEventProps) {
  const { attributes, listeners, setNodeRef, isDragging: isDraggable } = useDraggable({
    id: event.id,
    data: {
      type: "CALENDAR_EVENT",
      event,
      pumpId: event.pumpId,
    },
  });

  const stageLabel = STAGE_LABELS[event.stage] ?? event.stage;
  const idleDays = event.idleDays ?? 0;
  const status = idleDays > 6 ? "danger" : idleDays > 3 ? "warning" : "ok";

  const handleClick = () => onClick?.(event);
  const handleDoubleClick = () => onDoubleClick?.(event);

  const stageColorClass = STAGE_COLORS[event.stage] ?? STAGE_COLORS["QUEUE"];

  const statusChipClass =
    status === "danger"
      ? "bg-rose-500/20 text-rose-900 dark:text-rose-50"
      : status === "warning"
        ? "bg-amber-500/20 text-amber-900 dark:text-amber-50"
        : "bg-emerald-500/20 text-emerald-900 dark:text-emerald-50";

  if (isDragging) {
    return (
      <div
        className={cn(
          "relative flex h-[34px] w-full flex-col justify-center rounded-md border px-2 py-0.5 text-xs shadow-sm transition-all",
          stageColorClass,
          "cursor-grabbing opacity-50 ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* Simplified content for drag overlay */}
        <div className="font-bold">{event.title}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={
        {
          gridColumnStart: event.startDay + 1,
          gridColumnEnd: `span ${event.span}`,
          gridRowStart: event.row + 1,
        } as React.CSSProperties
      }
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex h-[34px] w-full flex-col justify-center rounded-md border px-2 py-0.5 text-xs shadow-sm transition-all hover:shadow-md",
        stageColorClass,
        isDraggable ? "opacity-50" : "opacity-100",
        "cursor-grab active:cursor-grabbing"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={`${event.title} - ${stageLabel} - PO ${event.subtitle}`}
    >
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
        <span className="truncate" title={stageLabel}>
          {stageLabel}
        </span>
        <span className="truncate text-[10px] normal-case text-foreground/75">
          {event.title}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="truncate">
          {event.customer ?? `PO ${event.subtitle}`}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
            statusChipClass
          )}
        >
          {status === "danger"
            ? "Stalled"
            : status === "warning"
              ? "At Risk"
              : "On Track"}
        </span>
      </div>

      {event.priority && (
        <div className="mt-1 flex items-center gap-1 text-[9px] text-foreground/80">
          <span className="font-semibold">Priority:</span>
          <span className="uppercase tracking-wide">{event.priority}</span>
        </div>
      )}
    </div>
  );
}
