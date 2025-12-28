import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface CollapseToggleProps {
  collapsed: boolean
  onToggle: () => void
}

export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="header-button h-14 w-14 rounded-full border border-border/60 bg-card/80 text-foreground"
      onClick={onToggle}
      title={collapsed ? 'Expand cards' : 'Collapse cards'}
      aria-label="Toggle pump card density"
    >
      {collapsed ? (
        <Maximize2 className="h-12 w-12" strokeWidth={3} />
      ) : (
        <Minimize2 className="h-12 w-12" strokeWidth={3} />
      )}
    </Button>
  )
}
