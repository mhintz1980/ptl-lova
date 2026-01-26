// src/components/toolbar/AddPoModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../store'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PoLine } from '../../types'
import {
  X,
  Plus,
  Loader2,
  Edit2,
  StickyNote,
  Trash2,
  AlertCircle,
  UploadCloud,
} from 'lucide-react'
import { toast } from 'sonner'
import { getModelPrice, getModelBom, getCatalogData } from '../../lib/seed'
import { cn } from '../../lib/utils'
import { formatCurrency } from '../../lib/format'
import { logErrorReport } from '../../lib/error-reporting'
import { parsePoCsv } from '../../lib/poCsvImport'
import { PrioritySelect } from '../ui/PrioritySelect'

interface AddPoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddPoModal({ isOpen, onClose }: AddPoModalProps) {
  const addPO = useApp((state) => state.addPO)
  const [po, setPo] = useState('')
  const [customer, setCustomer] = useState('')
  const [dateReceived, setDateReceived] = useState('')
  const [promiseDate, setPromiseDate] = useState('')
  const [lines, setLines] = useState<PoLine[]>([
    {
      model: '',
      quantity: 1,
      color: '',
      promiseDate: '',
      valueEach: 0,
      priority: 'Normal',
      engine: '',
      gearbox: '',
      notes: '',
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Edit/Note Popup State
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details')

  // Ref for modal focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ESC key handler and focus management
  useEffect(() => {
    if (!isOpen) return

    requestAnimationFrame(() => {
      modalRef.current?.focus()
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeLineIndex !== null) {
          // Close popup first if open
          setActiveLineIndex(null)
          e.preventDefault()
          e.stopPropagation()
        } else if (!isSaving) {
          e.preventDefault()
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose, activeLineIndex])

  const availableModels = useMemo(() => {
    const catalog = getCatalogData()
    return catalog.models.map((m) => m.model).sort()
  }, [])

  const { pumps } = useApp()
  const availableCustomers = useMemo(() => {
    const catalog = getCatalogData()
    const catalogCustomers = catalog.customers || []
    const pumpCustomers = pumps.map((p) => p.customer).filter(Boolean)
    return [...new Set([...catalogCustomers, ...pumpCustomers])].sort()
  }, [pumps])

  const isFormDirty = useMemo(() => {
    const hasLineData = lines.some((line) =>
      [
        line.model,
        line.color,
        line.promiseDate,
        line.valueEach,
        line.notes,
        line.engine,
        line.gearbox,
        line.quantity !== 1,
        line.priority && line.priority !== 'Normal',
      ].some(Boolean)
    )
    return Boolean(
      po ||
      customer ||
      dateReceived ||
      promiseDate ||
      hasLineData ||
      lines.length > 1
    )
  }, [po, customer, dateReceived, promiseDate, lines])

  // Inherit PO promise date
  useEffect(() => {
    if (promiseDate) {
      setLines((prevLines) =>
        prevLines.map((line) =>
          line.promiseDate ? line : { ...line, promiseDate }
        )
      )
    }
  }, [promiseDate])

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        model: '',
        quantity: 1,
        color: '',
        promiseDate: promiseDate || '',
        valueEach: 0,
        priority: 'Normal',
        engine: '',
        gearbox: '',
        notes: '',
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleLineChange = <T extends keyof PoLine>(
    index: number,
    field: T,
    value: PoLine[T]
  ) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }

    // Auto-populate logic
    if (field === 'model' && typeof value === 'string' && value) {
      const price = getModelPrice(value)
      const bom = getModelBom(value)
      newLines[index] = {
        ...newLines[index],
        valueEach: price > 0 ? price : newLines[index].valueEach,
        engine: bom.engine || '',
        gearbox: bom.gearbox || '',
      }
    }

    setLines(newLines)
  }

  const applyImport = (payload: ReturnType<typeof parsePoCsv>) => {
    setPo(payload.po)
    setCustomer(payload.customer)
    setDateReceived(payload.dateReceived ?? '')
    setPromiseDate(payload.promiseDate ?? '')
    setLines(payload.lines)
    setActiveLineIndex(null)
    setActiveTab('details')
  }

  const handleCsvFile = async (file: File) => {
    if (isFormDirty) {
      const confirmed = window.confirm(
        'Importing will overwrite the current form. Continue?'
      )
      if (!confirmed) return
    }

    try {
      const text = await file.text()
      const payload = parsePoCsv(text)
      applyImport(payload)
      toast.success(
        `Imported ${payload.lines.length} line items from ${file.name}`
      )
    } catch (error) {
      logErrorReport(error, {
        where: 'AddPoModal.handleCsvFile',
        what: 'Failed to import PO CSV',
        request: {
          route: 'AddPoModal',
          operation: 'import csv',
          inputSummary: `file=${file.name}`,
        },
      })
      toast.error(error instanceof Error ? error.message : 'Invalid CSV file')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!po.trim() || !customer.trim()) {
      toast.error('PO and Customer are required')
      return
    }

    const validLines = lines.filter(
      (line) => line.model.trim() && line.quantity > 0
    )
    if (validLines.length === 0) {
      toast.error('At least one line with a model is required')
      return
    }

    setIsSaving(true)
    try {
      await addPO({
        po,
        customer,
        dateReceived,
        promiseDate,
        lines: validLines,
      })
      toast.success(
        `Added ${validLines.reduce(
          (sum, l) => sum + l.quantity,
          0
        )} pumps to ${po}`
      )
      resetForm()
      onClose()
    } catch (error) {
      logErrorReport(error, {
        where: 'AddPoModal.handleSubmit',
        what: 'Failed to save purchase order',
        request: {
          route: 'AddPoModal',
          operation: 'submit purchase order',
          inputSummary: `poPrefix=${po.trim().slice(0, 6)} lines=${validLines.length}`,
        },
      })
      toast.error(
        'Failed to save to cloud. Please check your connection and try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = useCallback(() => {
    setPo('')
    setCustomer('')
    setDateReceived('')
    setPromiseDate('')
    setLines([
      {
        model: '',
        quantity: 1,
        color: '',
        promiseDate: '',
        valueEach: 0,
        priority: 'Normal',
        notes: '',
      },
    ])
  }, [])

  const handleCancel = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const { totalPumps, totalValue } = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const qty = line.quantity || 0
        const value = line.valueEach || 0
        return {
          totalPumps: acc.totalPumps + qty,
          totalValue: acc.totalValue + qty * value,
        }
      },
      { totalPumps: 0, totalValue: 0 }
    )
  }, [lines])

  // Reset form when modal closes (for consistency with Cancel/X button behavior)
  // This ensures form resets whether closed via Escape, Cancel button, or X button
  const prevOpenRef = React.useRef(isOpen)
  useEffect(() => {
    if (prevOpenRef.current && !isOpen) {
      // Modal just closed - reset form for next time
      resetForm()
    }
    prevOpenRef.current = isOpen
  }, [isOpen, resetForm])

  if (!isOpen) return null

  // --- Main Render ---

  // Get the active line for the detail overlay (if any)
  const activeLine = activeLineIndex !== null ? lines[activeLineIndex] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={handleCancel}
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl outline-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Detail Overlay - rendered inline to preserve focus across re-renders */}
        {activeLineIndex !== null && activeLine && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-white/10">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Line {activeLineIndex + 1} Details
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setActiveLineIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex border-b border-border bg-muted/20">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'flex-1 px-4 py-2 text-xs font-medium transition-colors hover:text-primary',
                    activeTab === 'details'
                      ? 'border-b-2 border-primary text-primary bg-primary/5'
                      : 'text-muted-foreground'
                  )}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    'flex-1 px-4 py-2 text-xs font-medium transition-colors hover:text-primary',
                    activeTab === 'notes'
                      ? 'border-b-2 border-primary text-primary bg-primary/5'
                      : 'text-muted-foreground'
                  )}
                >
                  Notes
                </button>
              </div>

              <div className="p-4 space-y-4">
                {activeTab === 'details' ? (
                  <div className="space-y-4 animate-in slide-in-from-left-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Engine
                        </label>
                        <Input
                          value={activeLine.engine ?? ''}
                          onChange={(e) =>
                            handleLineChange(
                              activeLineIndex,
                              'engine',
                              e.target.value
                            )
                          }
                          placeholder="e.g. Honda GX390"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Gearbox
                        </label>
                        <Input
                          value={activeLine.gearbox ?? ''}
                          onChange={(e) =>
                            handleLineChange(
                              activeLineIndex,
                              'gearbox',
                              e.target.value
                            )
                          }
                          placeholder="e.g. PA 2:1"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          These fields are auto-populated based on the selected
                          Model but can be overridden here.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in slide-in-from-right-2 duration-200">
                    <textarea
                      value={activeLine.notes ?? ''}
                      onChange={(e) =>
                        handleLineChange(
                          activeLineIndex,
                          'notes',
                          e.target.value
                        )
                      }
                      placeholder="Add any special instructions or notes for this line item..."
                      className="w-full min-h-[120px] rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-contain"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-muted/20 p-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setActiveLineIndex(null)}
                  className="px-6"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-[5px]">
          <div className="md:flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Add Purchase Order
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  New Order
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter PO details and line items below.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                data-testid="po-csv-input"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCsvFile(file)
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Create Order</>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-[7px] grid gap-[0.35rem] grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                PO Number *
              </label>
              <Input
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="PO-2024-..."
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Customer *
              </label>
              <div className="relative">
                <input
                  list="customer-options"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Select..."
                  className="flex h-9 w-full rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  required
                />
                <datalist id="customer-options">
                  {availableCustomers.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date Received
              </label>
              <Input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Promise Date
              </label>
              <Input
                type="date"
                value={promiseDate}
                onChange={(e) => setPromiseDate(e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
          </div>
          <div
            className={cn(
              'mx-6 mb-3 mt-3 rounded-xl border border-dashed px-4 py-2 text-xs text-muted-foreground transition-colors',
              isDragging
                ? 'border-primary/70 bg-primary/5 text-primary'
                : 'border-border/60'
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleCsvFile(file)
            }}
          >
            Drag and drop a CSV here, or click "Import CSV" to select a file.
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto relative bg-muted/5 group">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-card shadow-sm">
              <tr>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[30px] text-center">
                  #
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[145px] text-center">
                  Model
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[55px] text-center">
                  Qty
                </th>
                <th className="border-b border-border py-1 px-[3px] font-medium text-muted-foreground w-[110px] text-center">
                  Color
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[110px] text-center">
                  Value ($)
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[145px] text-center">
                  Priority
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground w-[110px] text-center">
                  Due Date
                </th>
                <th className="border-b border-border py-1 px-[5px] font-medium text-muted-foreground text-center w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {lines.map((line, index) => (
                <tr
                  key={index}
                  className="group/row hover:bg-muted/30 transition-colors bg-card"
                >
                  <td className="py-[5px] px-[5px] text-center text-muted-foreground text-xs">
                    {index + 1}
                  </td>
                  <td className="py-[5px] px-[5px]">
                    {availableModels.length ? (
                      <select
                        value={line.model}
                        onChange={(e) =>
                          handleLineChange(index, 'model', e.target.value)
                        }
                        className="w-full h-8 rounded border border-transparent hover:border-border bg-transparent focus:bg-muted/30 px-[5px] text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer text-center"
                        required
                      >
                        <option value="" disabled>
                          Select Model
                        </option>
                        {availableModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={line.model}
                        onChange={(e) =>
                          handleLineChange(index, 'model', e.target.value)
                        }
                        className="h-8 border-transparent hover:border-border focus:border-input bg-transparent px-[5px] text-center"
                      />
                    )}
                  </td>
                  <td className="py-[5px] px-[5px]">
                    <Input
                      type="number"
                      value={line.quantity || ''} // Allow empty display for 0
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          'quantity',
                          e.target.value === '' ? 0 : parseInt(e.target.value)
                        )
                      }
                      onFocus={(e) => e.target.select()} // Auto-select for quick replacement
                      className="h-8 w-full border-transparent hover:border-border focus:border-input bg-transparent text-center font-mono p-0"
                      min={1}
                    />
                  </td>
                  <td className="p-[3px]">
                    <Input
                      value={line.color ?? ''}
                      onChange={(e) =>
                        handleLineChange(index, 'color', e.target.value)
                      }
                      placeholder="Std"
                      className="h-8 border-transparent hover:border-border focus:border-input bg-transparent px-[3px] text-center"
                    />
                  </td>
                  <td className="py-[5px] px-[5px]">
                    <Input
                      type="number"
                      value={line.valueEach || ''} // Allow empty display for 0
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          'valueEach',
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      onFocus={(e) => e.target.select()} // Auto-select for quick replacement
                      className="h-8 border-transparent hover:border-border focus:border-input bg-transparent font-mono text-center p-0"
                      min={0}
                      step={0.01}
                    />
                  </td>
                  <td className="py-[5px] px-[5px]">
                    <PrioritySelect
                      value={line.priority ?? 'Normal'}
                      onChange={(priority) =>
                        handleLineChange(index, 'priority', priority)
                      }
                      size="sm"
                      className="flex w-full justify-center items-center gap-1"
                    />
                  </td>
                  <td className="py-[5px] px-[5px]">
                    <Input
                      type="date"
                      value={line.promiseDate ?? ''}
                      onChange={(e) =>
                        handleLineChange(index, 'promiseDate', e.target.value)
                      }
                      className="h-8 border-transparent hover:border-border focus:border-input bg-transparent text-xs p-0 text-center"
                    />
                  </td>
                  <td className="py-[5px] px-[5px] text-center">
                    <div className="flex items-center justify-center gap-1 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 shadow-sm"
                        title="Edit Details"
                        onClick={() => {
                          setActiveLineIndex(index)
                          setActiveTab('details')
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/20 shadow-sm',
                          line.notes &&
                            'text-amber-500 bg-amber-500/10 border-amber-500/20 opacity-100'
                        )}
                        title="Add Note"
                        onClick={() => {
                          setActiveLineIndex(index)
                          setActiveTab('notes')
                        }}
                      >
                        <StickyNote
                          className={cn(
                            'h-3.5 w-3.5',
                            line.notes && 'fill-current'
                          )}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 shadow-sm"
                        title="Delete Line"
                        onClick={() => handleRemoveLine(index)}
                        disabled={lines.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State / Add Button Area */}
          <div className="p-4 border-t border-border bg-card/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="w-full border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Line Item
            </Button>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="flex-shrink-0 border-t border-border bg-muted/40 px-6 py-[5px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 text-sm">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Pumps
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                  {totalPumps}
                </span>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Value
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-primary">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              All fields autosave to local state before submission.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
