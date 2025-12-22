// src/components/toolbar/AddPoModal.tsx
import React, { useMemo, useState } from 'react'
import { useApp } from '../../store'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PoLine, Priority } from '../../types'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getModelPrice } from '../../lib/seed'

interface AddPoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddPoModal({ isOpen, onClose }: AddPoModalProps) {
  const addPO = useApp((state) => state.addPO)
  const pumps = useApp((state) => state.pumps)
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
    },
  ])

  const priorityOptions: Priority[] = [
    'Low',
    'Normal',
    'High',
    'Rush',
    'Urgent',
  ]
  const availableModels = useMemo(() => {
    const models = pumps.map((pump) => pump.model)
    return Array.from(new Set(models)).sort()
  }, [pumps])

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        model: '',
        quantity: 1,
        color: '',
        promiseDate: '',
        valueEach: 0,
        priority: 'Normal',
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

    // Auto-populate valueEach when model is selected
    if (field === 'model' && typeof value === 'string' && value) {
      const price = getModelPrice(value)
      if (price > 0) {
        newLines[index] = { ...newLines[index], valueEach: price }
      }
    }

    setLines(newLines)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
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

    // Submit
    addPO({ po, customer, dateReceived, promiseDate, lines: validLines })
    toast.success(
      `Added ${validLines.reduce((sum, l) => sum + l.quantity, 0)} pumps to ${po}`
    )

    // Reset and close
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
      },
    ])
    onClose()
  }

  // Computed totals for PO summary
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-layer-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Add Purchase Order
            </h2>
            <p className="text-xs text-muted-foreground">
              Provide order details and line items to create pumps.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                PO Number *
              </label>
              <Input
                value={po}
                onChange={(e) => setPo(e.target.value)}
                placeholder="PO-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Customer *
              </label>
              <Input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Acme Manufacturing"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Date Received
              </label>
              <Input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Promise Date
              </label>
              <Input
                type="date"
                value={promiseDate}
                onChange={(e) => setPromiseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Line Items
              </h3>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleAddLine}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Line
              </Button>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-5"
                >
                  <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    <span>Line {index + 1}</span>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLine(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Model *
                      </label>
                      {availableModels.length ? (
                        <div className="rounded-lg border border-border bg-card">
                          <select
                            value={line.model}
                            onChange={(e) =>
                              handleLineChange(index, 'model', e.target.value)
                            }
                            className="h-11 w-full rounded-lg bg-transparent px-3 text-sm text-foreground focus:outline-none"
                            required
                          >
                            <option
                              value=""
                              className="bg-card text-foreground/70"
                            >
                              Select model
                            </option>
                            {availableModels.map((model) => (
                              <option
                                key={model}
                                value={model}
                                className="bg-card text-foreground"
                              >
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <Input
                          value={line.model}
                          onChange={(e) =>
                            handleLineChange(index, 'model', e.target.value)
                          }
                          placeholder="Enter model"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            'quantity',
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        min={1}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Powder Color
                      </label>
                      <Input
                        value={line.color ?? ''}
                        onChange={(e) =>
                          handleLineChange(index, 'color', e.target.value)
                        }
                        placeholder="Blue RAL 5015"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Value per Unit ($)
                      </label>
                      <Input
                        type="number"
                        value={line.valueEach ?? 0}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            'valueEach',
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        min={0}
                        step={0.01}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Priority
                      </label>
                      <div className="rounded-lg border border-border bg-card">
                        <select
                          value={line.priority ?? 'Normal'}
                          onChange={(e) =>
                            handleLineChange(
                              index,
                              'priority',
                              e.target.value as Priority
                            )
                          }
                          className="h-11 w-full rounded-lg bg-transparent px-3 text-sm text-foreground focus:outline-none"
                        >
                          {priorityOptions.map((option) => (
                            <option
                              key={option}
                              value={option}
                              className="bg-card text-foreground"
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Promise Date
                      </label>
                      <Input
                        type="date"
                        value={line.promiseDate ?? ''}
                        onChange={(e) =>
                          handleLineChange(index, 'promiseDate', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Line subtotal */}
                  <div className="mt-4 flex justify-end border-t border-border/50 pt-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Line Subtotal:{' '}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          (line.quantity || 0) * (line.valueEach || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PO Summary */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                PO Summary
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Total Pumps: </span>
                  <span className="font-semibold text-foreground">
                    {totalPumps}
                  </span>
                </span>
                <span className="text-border">|</span>
                <span>
                  <span className="text-muted-foreground">Total Value: </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalValue)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              Create Purchase Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
