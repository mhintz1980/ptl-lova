// src/components/print/KanbanFloorSheet.tsx
import { useMemo } from 'react'
import { useApp } from '../../store'
import { Pump, Stage } from '../../types'
import { format } from 'date-fns'
import { applyFilters } from '../../lib/utils'
import { sortPumps } from '../../lib/sort'

// Subset of stages for the floor sheet (Active Work)
const FLOOR_STAGES: Stage[] = [
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
]

// Determine if a pump is stalled (e.g., > 3 days in current stage)
const isStalled = (pump: Pump) => {
  if (!pump.last_update) return false
  const days = Math.floor(
    (Date.now() - new Date(pump.last_update).getTime()) / (1000 * 60 * 60 * 24)
  )
  return days > 3
}

export function KanbanFloorSheet() {
  const { pumps, filters, sortField, sortDirection } = useApp()

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters)
    return sortPumps(filtered, sortField, sortDirection)
  }, [pumps, filters, sortField, sortDirection])

  const pumpsByStage = useMemo(() => {
    return FLOOR_STAGES.reduce(
      (acc, stage) => {
        acc[stage] = filteredPumps.filter((pump) => pump.stage === stage)
        return acc
      },
      {} as Record<Stage, Pump[]>
    )
  }, [filteredPumps])

  const currentDate = format(new Date(), 'MMM d, yyyy')

  return (
    <div className="h-screen flex flex-col page-break-after-always p-4">
      <header className="mb-4 border-b-2 border-black pb-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            Daily Floor Sheet
          </h1>
          <p className="text-sm font-medium text-gray-600">
            {currentDate} • Active Production
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="font-bold">INSTRUCTIONS:</div>
          <div>[ ] Check "Moved" when job advances</div>
          <div>[ ] Write issues on "Stall" lines</div>
        </div>
      </header>

      {/* 5-Column Grid */}
      <div className="flex-1 grid grid-cols-5 gap-4 overflow-hidden">
        {FLOOR_STAGES.map((stage) => (
          <div
            key={stage}
            className="flex flex-col border-r border-gray-300 last:border-0 pr-2"
          >
            <h2 className="font-bold uppercase text-center border-b border-black mb-2 pb-1 text-sm bg-gray-100">
              {stage.replace(/_/g, ' ')}
            </h2>

            <div className="flex-col space-y-3">
              {pumpsByStage[stage].map((pump) => (
                <FloorCard key={pump.id} pump={pump} />
              ))}
              {pumpsByStage[stage].length === 0 && (
                <div className="text-center text-gray-400 italic text-xs mt-10">
                  No active jobs
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FloorCard({ pump }: { pump: Pump }) {
  const stalled = isStalled(pump)

  return (
    <div className="border border-gray-400 rounded p-2 text-xs bg-white break-inside-avoid shadow-sm">
      {/* Header: ID & Moved Checkbox */}
      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-sm truncate w-2/3">{pump.model}</div>
        <div className="flex items-center gap-1 border border-black px-1 rounded bg-gray-50">
          <div className="w-3 h-3 border border-gray-600 rounded-sm"></div>
          <span className="text-[10px] font-bold uppercase">Moved</span>
        </div>
      </div>

      {/* Details */}
      <div className="text-gray-600 mb-1">
        <div>
          <span className="font-mono">{pump.serial || 'No Serial'}</span> •{' '}
          {pump.customer}
        </div>
      </div>

      {/* Stage Specific Data */}
      {pump.stage === 'ASSEMBLY' && (
        <div className="border-t border-gray-200 mt-1 pt-1 space-y-1">
          {pump.engine && (
            <div>
              <span className="font-semibold">Eng:</span> {pump.engine}
            </div>
          )}
          {pump.gearbox && (
            <div>
              <span className="font-semibold">Gear:</span> {pump.gearbox}
            </div>
          )}
        </div>
      )}

      {pump.stage === 'POWDER_COAT' && pump.powder_color && (
        <div className="border-t border-gray-200 mt-1 pt-1">
          <span className="font-semibold">Color:</span> {pump.powder_color}
        </div>
      )}

      {/* Stalled / Issue Section */}
      <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
        {stalled && (
          <div className="text-red-600 font-bold mb-1">
            ⚠️ Stalled (&gt;3 days)
          </div>
        )}
        <div className="flex items-end gap-1">
          <span className="text-[9px] text-gray-400">Issue:</span>
          <div className="border-b border-gray-300 flex-1 h-3"></div>
        </div>
      </div>
    </div>
  )
}
