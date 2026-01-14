// src/components/kanban/KanbanBoard.tsx
import { useState, useMemo, memo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Pump, Stage } from '../../types'
import { StageColumn } from './StageColumn'
import { PumpCard } from './PumpCard'
import { useApp } from '../../store'
import { toast } from 'sonner'

const STAGES: Stage[] = [
  'QUEUE',
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
  'CLOSED',
]

interface KanbanBoardProps {
  pumps: Pump[]
  collapsed: boolean
  onCardClick?: (pump: Pump) => void
}

function KanbanBoardComponent({
  pumps,
  collapsed,
  onCardClick,
}: KanbanBoardProps) {
  const moveStage = useApp((state) => state.moveStage)
  const [activePump, setActivePump] = useState<Pump | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const pumpsByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = pumps.filter((pump) => pump.stage === stage)
      return acc
    }, {} as Record<Stage, Pump[]>)
  }, [pumps])

  const handleDragStart = (event: DragStartEvent) => {
    const pump = pumps.find((p) => p.id === event.active.id)
    setActivePump(pump ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePump(null)

    const { active, over } = event
    if (!over) return

    const pumpId = active.id as string
    const nextStage = (over.data?.current?.stage as Stage) ?? (over.id as Stage)
    const pump = pumps.find((p) => p.id === pumpId)

    if (pump && pump.stage !== nextStage) {
      // Serial gate: check if moving to a stage that requires serial
      const REQUIRES_SERIAL_STAGES: Stage[] = [
        'STAGED_FOR_POWDER',
        'POWDER_COAT',
        'ASSEMBLY',
        'SHIP',
        'CLOSED',
      ]
      const isUnassignedSerial = pump.serial === null
      if (REQUIRES_SERIAL_STAGES.includes(nextStage) && isUnassignedSerial) {
        // Don't show success toast - moveStage will show the error toast
        moveStage(pumpId, nextStage)
        return
      }

      moveStage(pumpId, nextStage)
      const displaySerial = isUnassignedSerial ? 'pending' : pump.serial
      toast.success(
        `Moved ${pump.model} (Serial #${displaySerial}) to ${nextStage}`
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-full w-full gap-4 overflow-x-auto pb-8 pr-4 scrollbar-themed">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            pumps={pumpsByStage[stage] ?? []}
            collapsed={collapsed}
            onCardClick={onCardClick}
            activeId={activePump?.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activePump ? (
          <PumpCard pump={activePump} collapsed={collapsed} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export const KanbanBoard = memo(KanbanBoardComponent)
