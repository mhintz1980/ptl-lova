// src/components/scheduling/SwimlaneGroup.tsx
// Schedule Page v2: Collapsible swimlane container for grouping jobs

import { ReactNode, memo } from 'react'
import { cn } from '../../lib/utils'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../store'

interface SwimlaneGroupProps {
  id: string
  label: string
  count: number
  children: ReactNode
}

function SwimlaneGroupComponent({
  id,
  label,
  count,
  children,
}: SwimlaneGroupProps) {
  const collapsed = useApp((state) => state.collapsedSwimlanes[id] ?? false)
  const toggleCollapse = useApp((state) => state.toggleSwimlaneCollapse)

  return (
    <div className="border-b border-border/30 last:border-b-0">
      {/* Swimlane Header */}
      <button
        onClick={() => toggleCollapse(id)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left',
          'bg-muted/30 hover:bg-muted/50 transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40'
        )}
        aria-expanded={!collapsed}
        aria-controls={`swimlane-content-${id}`}
      >
        <motion.span
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.15 }}
          className="text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.span>
        <span className="font-semibold text-sm truncate flex-1">{label}</span>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </button>

      {/* Swimlane Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id={`swimlane-content-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const SwimlaneGroup = memo(SwimlaneGroupComponent)
