// src/components/toolbar/ExportModal.tsx
import { useState, useMemo } from 'react'
import { useApp } from '../../store'
import { Button } from '../ui/Button'
import { X, Download } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCsv, downloadJson } from '../../lib/export'
import type { Pump } from '../../types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = 'csv' | 'json'

// Available columns from Pump type
const AVAILABLE_COLUMNS: Array<keyof Pump> = [
  'id',
  'serial',
  'po',
  'customer',
  'model',
  'stage',
  'priority',
  'powder_color',
  'last_update',
  'value',
  'forecastEnd',
]

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const filtered = useApp((state) => state.filtered)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(AVAILABLE_COLUMNS)
  )

  // Get filtered pumps (respects FilterBar state)
  const pumpsToExport = useMemo(() => filtered(), [filtered])
  const pumpCount = pumpsToExport.length

  const handleToggleColumn = (column: string) => {
    const newSelection = new Set(selectedColumns)
    if (newSelection.has(column)) {
      newSelection.delete(column)
    } else {
      newSelection.add(column)
    }
    setSelectedColumns(newSelection)
  }

  const handleSelectAll = () => {
    setSelectedColumns(new Set(AVAILABLE_COLUMNS))
  }

  const handleDeselectAll = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = () => {
    if (pumpCount === 0) {
      toast.error('No pumps to export')
      return
    }

    if (selectedColumns.size === 0) {
      toast.error('Please select at least one column to export')
      return
    }

    try {
      const columns = Array.from(selectedColumns)

      if (format === 'csv') {
        downloadCsv(pumpsToExport, columns)
        toast.success(
          `Exported ${pumpCount} pump${pumpCount !== 1 ? 's' : ''} to CSV`
        )
      } else {
        downloadJson(pumpsToExport, columns)
        toast.success(
          `Exported ${pumpCount} pump${pumpCount !== 1 ? 's' : ''} to JSON`
        )
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div
        className="relative w-full max-w-2xl flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl outline-none max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-[5px]">
          <div className="flex items-center justify-between min-h-[50px]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Export Data
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pumpCount} pump{pumpCount !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-muted/5 p-6">
          {/* Format Selection */}
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">
              Export Format
            </h3>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-blue-500/50 hover:bg-blue-500/5 flex-1 justify-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="h-4 w-4 cursor-pointer accent-blue-500"
                />
                <span className="text-sm font-medium text-foreground">CSV</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-blue-500/50 hover:bg-blue-500/5 flex-1 justify-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="h-4 w-4 cursor-pointer accent-blue-500"
                />
                <span className="text-sm font-medium text-foreground">
                  JSON
                </span>
              </label>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Columns
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400"
                >
                  Select All
                </button>
                <span className="text-[10px] text-muted-foreground/30">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_COLUMNS.map((column) => (
                <label
                  key={column}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border/30 bg-card/50 p-2 transition-colors hover:bg-card hover:border-border/60"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(column)}
                    onChange={() => handleToggleColumn(column)}
                    className="h-3.5 w-3.5 cursor-pointer rounded accent-blue-500"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {column}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border bg-muted/40 px-6 py-[5px]">
          <div className="flex items-center justify-end gap-3 min-h-[50px]">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full border-border/50 bg-white/5 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={pumpCount === 0 || selectedColumns.size === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
