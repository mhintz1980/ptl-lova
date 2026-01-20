// src/pages/Kanban.tsx
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import type { Pump } from '../types'
import { useApp } from '../store'

interface KanbanProps {
  pumps: Pump[]
  onSelectPump?: (pump: Pump) => void
}

export const Kanban = ({ pumps, onSelectPump }: KanbanProps) => {
  const collapsedCards = useApp((state) => state.collapsedCards)

  return (
    <div
      className="flex h-[calc(100vh-95px)] flex-col"
      data-testid="kanban-view"
    >
      <div className="flex-1">
        <KanbanBoard
          pumps={pumps}
          collapsed={collapsedCards}
          onCardClick={onSelectPump}
        />
      </div>
    </div>
  )
}
