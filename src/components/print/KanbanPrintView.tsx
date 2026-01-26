import { KanbanFloorSheet } from './KanbanFloorSheet'
import { WeeklyScheduleView } from './WeeklyScheduleView'
import { InventoryChecklist } from './InventoryChecklist'
import { useApp } from '../../store'
import { useEffect } from 'react'

export function KanbanPrintView() {
  const { load } = useApp()

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="font-sans text-black">
      {/* PAGE 1: Daily Floor Sheet (Kanban) */}
      <KanbanFloorSheet />

      {/* PAGE 2: Weekly Schedule */}
      <WeeklyScheduleView />

      {/* PAGE 3: Inventory Checklist */}
      <InventoryChecklist />
    </div>
  )
}
