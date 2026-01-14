// src/components/toolbar/ExportModal.tsx
import React, { useState, useMemo } from 'react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[hsl(var(--background))]/95 p-6 shadow-2xl backdrop-blur-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Export Data
              </h2>
              <p className="text-sm text-muted-foreground">
                {pumpCount} pump{pumpCount !== 1 ? 's' : ''} will be exported
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Format
          </label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="h-4 w-4 cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-foreground">CSV</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="h-4 w-4 cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-foreground">JSON</span>
            </label>
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-foreground">
              Columns to Export
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Select All
              </button>
              <span className="text-xs text-muted-foreground">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            {AVAILABLE_COLUMNS.map((column) => (
              <label
                key={column}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.has(column)}
                  onChange={() => handleToggleColumn(column)}
                  className="h-4 w-4 cursor-pointer rounded accent-blue-500"
                />
                <span className="text-sm text-foreground">{column}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={pumpCount === 0 || selectedColumns.size === 0}
          >
            <Download className="h-4 w-4" />
            Export {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  )
}
