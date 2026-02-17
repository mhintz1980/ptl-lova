// src/components/kanban/ManifestItem.tsx
import { Pump } from '../../types'
import { Undo2 } from 'lucide-react'

interface ManifestItemProps {
  pump: Pump
  onReopen?: (pump: Pump) => void
}

export function ManifestItem({ pump, onReopen }: ManifestItemProps) {
  return (
    <div className="group relative flex items-center justify-between rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs transition-colors hover:bg-card">
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        <span className="font-mono font-medium text-foreground">
          #{pump.serial ?? '----'}
        </span>
        <span className="truncate font-semibold text-foreground/80">
          {pump.model}
        </span>
        <span className="truncate text-muted-foreground">{pump.customer}</span>
      </div>

      <button
        onClick={() => onReopen?.(pump)}
        title="Reopen Pump"
        className="h-6 w-6 rounded-md p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 flex items-center justify-center"
      >
        <Undo2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  )
}
