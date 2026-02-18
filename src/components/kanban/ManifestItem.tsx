// src/components/kanban/ManifestItem.tsx
import { Pump } from '../../types'
import { Undo2 } from 'lucide-react'

interface ManifestItemProps {
  pump: Pump
  onReopen?: (pump: Pump) => void
  onClick?: (pump: Pump) => void
}

export function ManifestItem({ pump, onReopen, onClick }: ManifestItemProps) {
  return (
    <div
      onClick={() => onClick?.(pump)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(pump)
        }
      }}
      role="button"
      tabIndex={0}
      className="group relative flex items-center justify-between rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs transition-colors hover:bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        <span className="font-mono font-medium text-foreground">
          #{pump.serial ?? '----'}
        </span>
        <span className="truncate font-semibold text-foreground/80">
          {pump.model}
        </span>
        <span className="truncate text-muted-foreground">{pump.customer}</span>
      </div>

      {onReopen && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onReopen(pump)
          }}
          title="Reopen Pump"
          className="flex h-6 w-6 items-center justify-center rounded-md p-1 opacity-0 transition-opacity hover:bg-accent focus:opacity-100 focus:outline-none focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Undo2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  )
}
