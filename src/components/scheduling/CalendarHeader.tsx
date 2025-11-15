import { Button } from "../ui/Button";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  PRODUCTION_STAGES,
} from "../../lib/stage-constants";
import { cn } from "../../lib/utils";
import { useApp } from "../../store";
import { Wand2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CalendarHeader() {
  const clearNotStartedSchedules = useApp(
    (state) => state.clearNotStartedSchedules
  );
  const levelNotStartedSchedules = useApp(
    (state) => state.levelNotStartedSchedules
  );

  const handleClear = () => {
    const cleared = clearNotStartedSchedules();
    if (!cleared) {
      toast.info("No scheduled jobs to clear.");
      return;
    }
    toast.success(`Cleared ${cleared} scheduled job${cleared === 1 ? "" : "s"}.`);
  };

  const handleLevel = () => {
    const leveled = levelNotStartedSchedules();
    if (!leveled) {
      toast.info("No scheduled jobs ready to level.");
      return;
    }
    toast.success(`Re-leveled ${leveled} job${leveled === 1 ? "" : "s"} across the fabrication calendar.`);
  };

  return (
    <div
      className="border-b border-border/70 bg-card/90 px-4 py-4 text-foreground"
      data-testid="calendar-header"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-x-auto pr-4">
          {PRODUCTION_STAGES.map((stage) => (
            <div
              key={stage}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[11px] text-foreground/80"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full border",
                  STAGE_COLORS[stage]
                )}
                aria-hidden="true"
              />
              {STAGE_LABELS[stage]}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleLevel}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Level
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
          >
            <Wand2 className="mr-2 h-3.5 w-3.5" />
            Auto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleClear}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
