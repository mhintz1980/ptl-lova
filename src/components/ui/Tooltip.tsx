// src/components/ui/Tooltip.tsx
import * as React from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  className,
  side = "top",
  align = "center",
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = React.useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  }, [delay, timeoutId]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  }, [timeoutId]);

  // Position calculation based on side and align
  const getPositionClasses = () => {
    const positions = {
      top: {
        start: "bottom-full left-0 mb-2",
        center: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        end: "bottom-full right-0 mb-2",
      },
      bottom: {
        start: "top-full left-0 mt-2",
        center: "top-full left-1/2 -translate-x-1/2 mt-2",
        end: "top-full right-0 mt-2",
      },
      left: {
        start: "right-full top-0 mr-2",
        center: "right-full top-1/2 -translate-y-1/2 mr-2",
        end: "right-full bottom-0 mr-2",
      },
      right: {
        start: "left-full top-0 ml-2",
        center: "left-full top-1/2 -translate-y-1/2 ml-2",
        end: "left-full bottom-0 ml-2",
      },
    };
    return positions[side]?.[align] || positions.top.center;
  };

  const getArrowClasses = () => {
    const arrows = {
      top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-current",
      bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-current",
      left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-current",
      right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-current",
    };
    return arrows[side] || arrows.top;
  };

  React.useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <div ref={triggerRef} className="inline-block">
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          aria-live="polite"
          className={cn(
            "absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700",
            "max-w-xs break-words pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            getPositionClasses(),
            className
          )}
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0 border-4",
                getArrowClasses()
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}
