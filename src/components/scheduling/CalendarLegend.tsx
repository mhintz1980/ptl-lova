// src/components/scheduling/CalendarLegend.tsx
import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import type { Stage } from "../../types";

interface CalendarLegendProps {
  className?: string;
}

// Only show active stages in the legend (excluding unscheduled and closed)
const ACTIVE_STAGES: Stage[] = [
  "NOT STARTED",
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
];

function LegendItem({ stage }: { stage: Stage }) {
  const colorClass = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];

  return (
    <Tooltip
      content={
        <div className="text-center">
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-300 mt-1">
            {stage === "NOT STARTED"
              ? "Items not yet scheduled"
              : `Production stage: ${label.toLowerCase()}`
            }
          </div>
        </div>
      }
      side="top"
      align="center"
    >
      <div className="flex items-center gap-2 rounded-lg px-3 py-1 transition-colors hover:bg-muted/50 cursor-default">
        <div
          className={cn(
            "stage-color w-4 h-4 rounded-md border",
            colorClass
          )}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground/80">
          {label}
        </span>
      </div>
    </Tooltip>
  );
}

export function CalendarLegend({ className }: CalendarLegendProps) {
  const [isExpanded, setIsExpanded] = React.useState(() => {
    // Default to expanded on larger screens, collapsed on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("border-b border-border bg-card", className)}>
      <div className="px-6 py-3">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
            Production Stages
          </h2>

          <button
            type="button"
            onClick={toggleExpanded}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm text-foreground/60 hover:text-foreground transition-colors",
              "md:hidden" // Only show on mobile
            )}
            aria-expanded={isExpanded}
            aria-controls="legend-content"
          >
            <span className="text-xs">
              {isExpanded ? "Hide" : "Show"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Legend Content */}
        <div
          id="legend-content"
          className={cn(
            "mt-3",
            isExpanded ? "block" : "hidden md:block" // Always show on desktop, toggle on mobile
          )}
        >
          <div
            className="flex flex-wrap items-center gap-3"
            role="list"
            aria-label="Production stage color legend showing calendar timeline colors"
          >
            {ACTIVE_STAGES.map((stage) => (
              <div
                key={stage}
                role="listitem"
                className="flex items-center"
              >
                <LegendItem stage={stage} />
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-foreground/50" role="note">
            Colors indicate production stages in the calendar timeline. Hover over stages for more information.
          </div>
        </div>
      </div>
    </div>
  );
}
