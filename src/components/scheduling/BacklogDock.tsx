import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { UnscheduledJobCard } from "./UnscheduledJobCard";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import type { Pump } from "../../types";
import { useApp } from "../../store";
import { sortPumps } from "../../lib/sort";

interface BacklogDockProps {
  pumps: Pump[];
  collapsed: boolean;
}

export function BacklogDock({ pumps, collapsed }: BacklogDockProps) {
  const [open, setOpen] = useState(true);
  const sortField = useApp((state) => state.sortField);
  const sortDirection = useApp((state) => state.sortDirection);

  const { setNodeRef, isOver } = useDroppable({
    id: "backlog-dock",
    data: { type: "BACKLOG" },
  });

  const unscheduledPumps = useMemo(
    () => pumps.filter((pump) => pump.stage === "QUEUE" && !pump.scheduledStart),
    [pumps]
  );
  const sortedPumps = useMemo(
    () => sortPumps(unscheduledPumps, sortField, sortDirection),
    [unscheduledPumps, sortField, sortDirection]
  );

  return (
    <aside
      ref={setNodeRef}
      className={cn(
        "relative flex h-full flex-col border-r border-border/60 bg-card/85 text-foreground shadow-inner transition-all duration-300",
        open ? "w-[260px] flex-shrink-0" : "w-10",
        isOver && "bg-primary/10 ring-2 ring-inset ring-primary/50"
      )}
      data-testid="backlog-dock"
    >
      <button
        type="button"
        className="header-button absolute -right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle backlog dock"
      >
        {open ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {open ? (
        <>
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Backlog
              </p>
              <h3 className="text-base font-semibold text-foreground">
                {sortedPumps.length} jobs
              </h3>
            </div>
            {sortedPumps.length > 0 && (
              <button
                onClick={() => {
                  const count = useApp.getState().autoSchedule();
                  if (count > 0) {
                    toast.success(`Autoscheduled ${count} jobs`);
                  } else {
                    toast.info("No slots available or backlog empty");
                  }
                }}
                className="flex h-7 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
                title="Automatically schedule jobs based on priority and capacity"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto
              </button>
            )}
          </header>

          <div className="flex-1 overflow-hidden px-4 py-4">
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-themed">
              {sortedPumps.map((pump) => (
                <UnscheduledJobCard
                  key={pump.id}
                  pump={pump}
                  collapsed={collapsed}
                />
              ))}

              {sortedPumps.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-xs text-muted-foreground">
                  {isOver ? "Drop to unschedule" : "Nothing matches the current filters."}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>Backlog</span>
          <span className="text-lg text-foreground">{sortedPumps.length}</span>
        </div>
      )}
    </aside>
  );
}
