import { cn } from "../../lib/utils";
import type { CalendarStageEvent } from "../../lib/schedule";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import { useDraggable } from "@dnd-kit/core";

interface CalendarEventProps {
  event: CalendarStageEvent;
  onClick: (event: CalendarStageEvent) => void;
  isDragging?: boolean;
}

export function CalendarEvent({ event, onClick, isDragging = false }: CalendarEventProps) {
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
  const handleClick = () => onClick(event);
  const stageColorClass = STAGE_COLORS[event.stage] ?? STAGE_COLORS["QUEUE"];

  const statusChipClass =
    status === "danger"
      ? "bg-rose-500/20 text-rose-900 dark:text-rose-50"
      : status === "warning"
        ? "bg-amber-400/25 text-amber-900 dark:text-amber-50"
        : "bg-emerald-400/25 text-emerald-900 dark:text-emerald-50";

  const isEffectiveDragging = isDragging || isDraggable;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "group flex h-full cursor-pointer flex-col justify-between rounded-xl border px-2.5 py-1.5 text-[11px] shadow-layer-sm transition-all duration-150",
        stageColorClass,
        isEffectiveDragging ? "opacity-30 border-dashed" : "hover:brightness-95"
      )}
      style={{
        gridColumn: `${event.startDay + 1} / span ${event.span}`,
        minWidth: "100%",
        zIndex: isEffectiveDragging ? 10 : 1,
      }}
      data-testid="calendar-event"
      data-pump-id={event.pumpId}
      data-stage={event.stage}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
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
