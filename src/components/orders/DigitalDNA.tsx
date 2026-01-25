// src/components/orders/DigitalDNA.tsx
import React from 'react'
import { Tooltip } from '../ui/Tooltip'
import { DigitalDnaStrand, DnaSegment } from '../../types/dna'
import { cn } from '../../lib/utils'
import { AlertTriangle, Lock } from 'lucide-react'

interface DigitalDNAProps {
  strand: DigitalDnaStrand
  className?: string
  onSegmentClick?: (segment: DnaSegment) => void
}

export const DigitalDNA: React.FC<DigitalDNAProps> = ({
  strand,
  className,
  onSegmentClick,
}) => {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {strand.segments.map((segment) => (
        <DnaSegmentItem
          key={segment.id}
          segment={segment}
          onClick={() => onSegmentClick?.(segment)}
        />
      ))}
    </div>
  )
}

interface DnaSegmentItemProps {
  segment: DnaSegment
  onClick?: () => void
}

const DnaSegmentItem: React.FC<DnaSegmentItemProps> = ({
  segment,
  onClick,
}) => {
  // Determine opacity based on completion/activity
  // If active, full opacity. If completed, slightly less? Or based on ratio?
  // Let's use activeRatio and completionRatio to determine look.

  // If the stage is "empty" (no pumps ever reached it or will reach it?), explicitly gray out?
  // Actually, standard logic:
  // - If completionRatio > 0 or activeRatio > 0, it has color.
  // - If both are 0, it's a "future" or "empty" stage, maybe lighter gray or very faint color.

  // Base transparency
  // If no pumps in this stage ever, maybe 10% opacity
  // If pumps are present, 100% opacity
  // But we want to show "progress" or "DNA" feel.

  // Design decision:
  // - Use the segment.colorClass for the background.
  // - Opacity 100% if activeRatio > 0 (currently working here)
  // - Opacity 60% if completed (passed through)
  // - Opacity 20% if future/empty

  const isActive = segment.activeRatio > 0
  const isClickable = Boolean(onClick)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.()
    }
  }

  let opacityClass = 'opacity-20'
  if (isActive)
    opacityClass = 'opacity-100 ring-1 ring-inset ring-white/20' // Highlight active
  else if (segment.completionRatio > 0) opacityClass = 'opacity-60'

  return (
    <Tooltip
      content={
        <div className="space-y-1 text-xs">
          <div className="font-bold flex items-center gap-2">
            {segment.label}
            {segment.hasIssues && (
              <AlertTriangle className="h-3 w-3 text-red-400" />
            )}
            {segment.isBlocked && <Lock className="h-3 w-3 text-amber-400" />}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
            <span>Total:</span>
            <span className="text-right text-foreground">
              {segment.totalCount}
            </span>
            <span>Active:</span>
            <span className="text-right text-foreground">
              {segment.activeCount}
            </span>
            <span>Comp:</span>
            <span className="text-right text-foreground">
              {segment.completedCount}
            </span>
          </div>
        </div>
      }
    >
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={`Stage ${segment.label}`}
        aria-disabled={!isClickable}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        className={cn(
          'h-8 w-3 rounded-none transition-all hover:scale-110 hover:z-10 relative',
          isClickable ? 'cursor-pointer' : 'cursor-default',
          'first:rounded-l-sm last:rounded-r-sm', // Rounded ends for the whole strand
          segment.colorClass, // The stage color
          opacityClass,
          segment.hasIssues && 'animate-pulse' // Pulse if issues
        )}
      >
        {/* Inner indicators could go here, e.g. a small dot for issues */}
        {segment.hasIssues && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full mb-0.5" />
        )}
      </div>
    </Tooltip>
  )
}
