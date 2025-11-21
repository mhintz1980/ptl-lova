import { useState } from "react";
import { BacklogDock } from "./BacklogDock";
import { DragAndDropContext } from "./DragAndDropContext";
import { CalendarHeader } from "./CalendarHeader";
import { MainCalendarGrid } from "./MainCalendarGrid";
import { PumpDetailModal } from "../ui/PumpDetailModal";
import type { Pump } from "../../types";
import { useApp } from "../../store";
import type { CalendarStageEvent } from "../../lib/schedule";

interface SchedulingViewProps {
  pumps: Pump[];
}

export function SchedulingView({ pumps }: SchedulingViewProps) {
  const collapsedCards = useApp((state) => state.collapsedCards);
  const schedulingStageFilters = useApp((state) => state.schedulingStageFilters);
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);

  const handleEventDoubleClick = (event: CalendarStageEvent) => {
    const pump = pumps.find((p) => p.id === event.pumpId);
    if (pump) {
      setSelectedPump(pump);
    }
  };

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
            onEventDoubleClick={handleEventDoubleClick}
          />
        </div>
        <PumpDetailModal
          pump={selectedPump}
          onClose={() => setSelectedPump(null)}
        />
      </div>
    </DragAndDropContext>
  );
}
