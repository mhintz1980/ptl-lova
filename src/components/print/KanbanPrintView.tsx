import { useMemo, useEffect } from 'react'
import { useApp } from '../../store'
import { Pump, Stage } from '../../types'
import { format } from 'date-fns'
import { applyFilters } from '../../lib/utils'
import { sortPumps } from '../../lib/sort'
import { STAGE_SEQUENCE } from '../../lib/stage-constants'
import { StageColumn } from '../kanban/StageColumn'

export function KanbanPrintView() {
  const { pumps, filters, sortField, sortDirection, load, collapsedCards } =
    useApp()

  useEffect(() => {
    load()
  }, [load])

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters)
    return sortPumps(filtered, sortField, sortDirection)
  }, [pumps, filters, sortField, sortDirection])

  const pumpsByStage = useMemo(() => {
    return STAGE_SEQUENCE.reduce(
      (acc, stage) => {
        acc[stage] = filteredPumps.filter((pump) => pump.stage === stage)
        return acc
      },
      {} as Record<Stage, Pump[]>
    )
  }, [filteredPumps])

  const currentDate = format(new Date(), 'MMM d, yyyy h:mm a')

  // Metrics for header
  const totalCount = filteredPumps.length
  const totalValue = filteredPumps.reduce((sum, p) => sum + (p.value || 0), 0)
  const urgentCount = filteredPumps.filter(
    (p) => p.priority === 'Urgent'
  ).length

  return (
    <div className="print-container font-sans text-xs text-black">
      {/* PAGE 1: Visual Kanban Board */}
      <div className="h-screen flex flex-col page-break-after-always">
        <header className="mb-4 border-b-2 border-black pb-2 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
              Visual Board
            </h1>
            <div className="text-xs font-medium text-gray-600">
              {currentDate}
            </div>
          </div>
          {/* QR Code Placeholder */}
          <div className="w-[48px] h-[48px] border border-gray-300 flex items-center justify-center bg-gray-50 text-[8px] text-center text-gray-400">
            QR CODE
          </div>
        </header>

        {/* Scaled Board */}
        <div className="flex-1 overflow-visible">
          <div className="flex gap-2 transform scale-75 origin-top-left w-[133%]">
            {STAGE_SEQUENCE.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                pumps={pumpsByStage[stage] ?? []}
                collapsed={collapsedCards}
                // No onClick handler for print view (read-only)
              />
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 2: Tabular Report */}
      <div className="min-h-screen pt-8">
        {/* Header */}
        <header className="mb-6 border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">
              Production Status
            </h1>
            <div className="text-sm font-medium text-gray-600">
              Generated: {currentDate}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-bold">Filters:</span>{' '}
              {Object.keys(filters).length
                ? JSON.stringify(filters)
                : 'None (Showing All)'}
            </div>
          </div>

          <div className="flex gap-6 text-right">
            <div>
              <div className="text-xs text-gray-500 uppercase">Total WIP</div>
              <div className="text-xl font-bold">{totalCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Value</div>
              <div className="text-xl font-bold">
                ${totalValue.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Urgent</div>
              <div className="text-xl font-bold text-red-600">
                {urgentCount}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {STAGE_SEQUENCE.map((stage) => {
            const stagePumps = pumpsByStage[stage]
            if (stagePumps.length === 0) return null

            return (
              <section key={stage} className="break-inside-avoid">
                <div className="flex items-center justify-between border-b border-black/50 mb-2 pb-1">
                  <h2 className="text-lg font-bold uppercase">
                    {stage.replace(/_/g, ' ')}
                  </h2>
                  <span className="text-sm font-semibold bg-gray-100 px-2 rounded">
                    {stagePumps.length} items
                  </span>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-200">
                      <th className="py-1 w-[120px]">Model</th>
                      <th className="py-1 w-[80px]">Serial</th>
                      <th className="py-1 w-[150px]">Customer</th>
                      <th className="py-1 w-[100px]">PO #</th>
                      <th className="py-1 w-[80px]">Priority</th>
                      <th className="py-1 w-[60px]">Days</th>
                      <th className="py-1 w-[60px] text-center">QC</th>
                      <th className="py-1 w-[60px] text-center">Parts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagePumps.map((pump) => {
                      const daysInStage = pump.last_update
                        ? Math.floor(
                            (Date.now() -
                              new Date(pump.last_update).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0

                      const isStale = daysInStage > 3
                      const isUrgent = pump.priority === 'Urgent'

                      return (
                        <tr
                          key={pump.id}
                          className={`border-b border-gray-100 ${isUrgent ? 'bg-red-50' : ''}`}
                        >
                          <td className="py-2 font-medium">{pump.model}</td>
                          <td className="py-2 font-mono text-gray-600">
                            {pump.serial || '-'}
                          </td>
                          <td className="py-2 truncate max-w-[150px]">
                            {pump.customer}
                          </td>
                          <td className="py-2 font-mono text-xs">{pump.po}</td>
                          <td className="py-2">
                            {isUrgent && (
                              <span className="font-bold text-red-600">
                                URGENT
                              </span>
                            )}
                            {!isUrgent && pump.priority}
                          </td>
                          <td
                            className={`py-2 ${isStale ? 'text-red-600 font-bold' : ''}`}
                          >
                            {daysInStage}d
                          </td>
                          <td className="py-2 text-center text-gray-300 border-l border-r border-gray-100">
                            <div className="w-4 h-4 border border-gray-300 mx-auto rounded-sm"></div>
                          </td>
                          <td className="py-2 text-center text-gray-300 border-r border-gray-100">
                            <div className="w-4 h-4 border border-gray-300 mx-auto rounded-sm"></div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end text-[10px] text-gray-500">
          <div>
            <p>CONFIDENTIAL - INTERNAL USE ONLY</p>
            <p>PumpTracker Lite - Production Management System</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <div className="w-48 border-b border-gray-300"></div>
              <span>Shift Supervisor</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-48 border-b border-gray-300"></div>
              <span>Date</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
