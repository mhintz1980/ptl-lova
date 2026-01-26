// src/components/orders/DigitalDNA.tsx
import React from 'react'
import { Tooltip } from '../ui/Tooltip'
import { DigitalDnaStrand, DnaPumpItem } from '../../types/dna'
import { cn } from '../../lib/utils'
import { AlertTriangle } from 'lucide-react'

interface DigitalDNAProps {
  strand: DigitalDnaStrand
  className?: string
  onItemClick?: (item: DnaPumpItem) => void
}

export const DigitalDNA: React.FC<DigitalDNAProps> = ({
  strand,
  className,
  onItemClick,
}) => {
  return (
    <div className={cn('flex items-center gap-[1px]', className)}>
      {strand.dnaItems.map((item) => (
        <DnaItem
          key={item.id}
          item={item}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  )
}

interface DnaItemProps {
  item: DnaPumpItem
  onClick?: () => void
}

const DnaItem: React.FC<DnaItemProps> = ({ item, onClick }) => {
  const isClickable = Boolean(onClick)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.()
    }
  }

  // Visuals
  // If completed/shipped, it's a solid bar (Option A) in Blue.
  // Queue is Dark Grey.
  // Others are Colored.
  // Pulse if has issues.

  return (
    <Tooltip
      content={
        <div className="space-y-1 text-xs">
          <div className="font-bold flex items-center gap-2">
            {item.stage}
            {item.hasIssues && (
              <AlertTriangle className="h-3 w-3 text-red-400" />
            )}
          </div>
          <div className="text-muted-foreground">
            ID: {item.id.substring(0, 8)}...
          </div>
        </div>
      }
    >
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={`Pump ${item.id} - ${item.stage}`}
        aria-disabled={!isClickable}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        className={cn(
          'h-8 w-1.5 rounded-[1px] transition-all hover:scale-y-110 hover:z-10 relative',
          isClickable ? 'cursor-pointer' : 'cursor-default',
          item.colorClass,
          item.hasIssues && 'animate-pulse ring-1 ring-red-500'
          // Optionally add specific styling for Completed if it wasn't just color
          // But "Option A" was just color.
        )}
      />
    </Tooltip>
  )
}
