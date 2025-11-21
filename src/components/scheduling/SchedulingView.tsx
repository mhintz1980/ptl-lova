import { BacklogDock } from "./BacklogDock";
import { DragAndDropContext } from "./DragAndDropContext";
import { CalendarHeader } from "./CalendarHeader";
import { MainCalendarGrid } from "./MainCalendarGrid";
import type { Pump } from "../../types";
import { useApp } from "../../store";

interface SchedulingViewProps {
  pumps: Pump[];
}

export function SchedulingView({ pumps }: SchedulingViewProps) {
  const collapsedCards = useApp((state) => state.collapsedCards);
  const schedulingStageFilters = useApp((state) => state.schedulingStageFilters);

  return (
    <DragAndDropContext pumps={pumps}>
      <div
        className="flex min-h-[calc(100vh-160px)] flex-col gap-4"
        data-testid="scheduling-view"
      >
        <CalendarHeader />
        <div className="flex flex-1 gap-4 overflow-hidden">
          <BacklogDock pumps={pumps} collapsed={collapsedCards} />
          <MainCalendarGrid
            pumps={pumps}
            visibleStages={schedulingStageFilters}
          />
        </div>
      </div>
    </DragAndDropContext>
  );
}
