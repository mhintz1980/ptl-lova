import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../../store";
import { UnscheduledJobCard } from "./UnscheduledJobCard";
import { cn } from "../../lib/utils";
import type { Pump } from "../../types";

type FilterKey = "overdue" | "priority" | "info";

const FILTERS: Array<{
  key: FilterKey;
  label: string;
  predicate: (pump: Pump) => boolean;
}> = [
  {
    key: "overdue",
    label: "Overdue",
    predicate: (pump) =>
      Boolean(pump.scheduledEnd && new Date(pump.scheduledEnd) < new Date()),
  },
  {
    key: "priority",
    label: "Ready",
    predicate: (pump) => ["High", "Rush", "Urgent"].includes(pump.priority),
  },
  {
    key: "info",
    label: "Needs Info",
    predicate: (pump) => !pump.powder_color,
  },
];

export function BacklogDock() {
  const pumps = useApp((state) => state.pumps);
  const collapsedCards = useApp((state) => state.collapsedCards);

  const [open, setOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);

  const unscheduledPumps = useMemo(
    () => pumps.filter((pump) => pump.stage === "UNSCHEDULED"),
    [pumps]
  );

  const predicateMap = useMemo(
    () =>
      FILTERS.reduce<Record<FilterKey, (pump: Pump) => boolean>>(
        (acc, filter) => ({ ...acc, [filter.key]: filter.predicate }),
        {} as Record<FilterKey, (pump: Pump) => boolean>
      ),
    []
  );

  const filteredPumps = useMemo(() => {
    if (!activeFilters.length) {
      return unscheduledPumps;
    }

    return unscheduledPumps.filter((pump) =>
      activeFilters.some((filter) => predicateMap[filter]?.(pump))
    );
  }, [unscheduledPumps, activeFilters, predicateMap]);

  const toggleFilter = (filter: FilterKey) => {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((value) => value !== filter)
        : [...current, filter]
    );
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border/60 bg-card/85 text-foreground shadow-inner transition-all duration-300",
        open ? "w-[23%] min-w-[260px] max-w-sm" : "w-10"
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
                {filteredPumps.length} jobs
              </h3>
            </div>
          </header>

          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            {FILTERS.map(({ key, label }) => {
              const active = activeFilters.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                    active
                      ? "bg-primary/90 text-primary-foreground shadow-glow"
                      : "border border-border/70 bg-card/70 text-foreground/70 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden px-4 py-4">
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-themed">
              {filteredPumps.map((pump) => (
                <UnscheduledJobCard
                  key={pump.id}
                  pump={pump}
                  collapsed={collapsedCards}
                />
              ))}

              {filteredPumps.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-xs text-muted-foreground">
                  Nothing matches the current filters.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>Backlog</span>
          <span className="text-lg text-foreground">{filteredPumps.length}</span>
        </div>
      )}
    </aside>
  );
}
