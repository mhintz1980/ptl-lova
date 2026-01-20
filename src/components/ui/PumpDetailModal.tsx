import { useState, useEffect, useMemo, useRef } from 'react'
import { Pump, Stage, STAGES } from '../../types'
import {
  type StageDurations,
  type StageBlock,
  projectPumpTimeline,
} from '../../lib/projection-engine'
import {
  Edit2,
  Save,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pause,
  Play,
} from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { format, parseISO, isValid } from 'date-fns'
import { useApp } from '../../store'
import { cn } from '../../lib/utils'
import { getCatalogData } from '../../lib/seed'
import { countWorkingDays } from '../../lib/working-days'
import {
  getPumpStageMoveEvents,
  getStagedForPowderHistory,
} from '../../lib/stage-history'
import { EventHistoryTimeline } from './EventHistoryTimeline'
import { PrioritySelect } from './PrioritySelect'

// Constitution §2.1: Canonical production stages for progress bar
const PROGRESS_STAGES: Stage[] = [
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
]

// Constitution §2.1: Stage colors for progress bar
const STAGE_BAR_COLORS: Record<Stage, string> = {
  QUEUE: 'from-slate-600 to-slate-400',
  FABRICATION: 'from-blue-600 to-blue-400',
  STAGED_FOR_POWDER: 'from-cyan-600 to-cyan-400',
  POWDER_COAT: 'from-purple-600 to-purple-400',
  ASSEMBLY: 'from-amber-600 to-amber-400',
  SHIP: 'from-emerald-600 to-emerald-400',
  CLOSED: 'from-green-600 to-green-400',
}

function TimelineProgress({
  pump,
  blocks,
}: {
  pump: Pump
  blocks: StageBlock[]
}) {
  if (!blocks || blocks.length === 0) return null

  const currentStage = pump.stage
  const now = new Date()

  return (
    <div className="space-y-6 mb-8 mt-2">
      <div className="relative flex w-full h-12 rounded-xl overflow-visible bg-muted/10 border border-white/5 p-1">
        {PROGRESS_STAGES.map((stage, idx) => {
          const block = blocks.find((b) => b.stage === stage)
          const stageIndex = PROGRESS_STAGES.indexOf(stage)
          const currentStageIndex = PROGRESS_STAGES.indexOf(currentStage)

          let fillWidth = '0%'
          let isCompleted = false
          let isCurrent = false

          if (currentStage === 'CLOSED') {
            fillWidth = '100%'
            isCompleted = true
          } else if (stageIndex < currentStageIndex) {
            fillWidth = '100%'
            isCompleted = true
          } else if (stageIndex === currentStageIndex) {
            isCurrent = true
            if (block) {
              const total = block.end.getTime() - block.start.getTime()
              const elapsed = now.getTime() - block.start.getTime()
              const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
              fillWidth = `${pct}%`
            } else {
              fillWidth = '30%'
            }
          }

          return (
            <div key={stage} className="relative flex-1 group">
              {/* The Track Segment */}
              <div className="absolute inset-0 mx-[1px] bg-white/5 rounded-md overflow-hidden">
                {/* Fill */}
                <div
                  className={cn(
                    'h-full transition-all duration-1000',
                    isCompleted
                      ? `bg-gradient-to-r ${STAGE_BAR_COLORS[stage]}`
                      : isCurrent
                        ? `bg-gradient-to-r ${STAGE_BAR_COLORS[stage]} animate-pulse`
                        : 'bg-transparent'
                  )}
                  style={{ width: fillWidth }}
                />
                {isCurrent && (
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r opacity-10',
                      STAGE_BAR_COLORS[stage]
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className="relative z-10 flex items-center justify-center h-full">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest transition-all',
                    isCompleted || isCurrent
                      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                      : 'text-muted-foreground/40'
                  )}
                >
                  {stage === 'POWDER_COAT' ? 'POWDER' : stage}
                </span>
              </div>

              {/* Divider Dates - Sitting above the line */}
              {block && (
                <>
                  <div className="absolute -top-6 -left-2 text-[9px] text-muted-foreground/80 font-semibold tracking-tighter">
                    {format(block.start, 'MMM d')}
                  </div>
                  {idx === PROGRESS_STAGES.length - 1 && (
                    <div className="absolute -top-6 -right-2 text-[9px] text-muted-foreground/80 font-semibold tracking-tighter">
                      {format(block.end, 'MMM d')}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PumpDetailModalProps {
  pump: Pump | null
  onClose: () => void
}

interface PumpFormData extends Pump {
  engine_model?: string | null
  gearbox_model?: string | null
  control_panel_model?: string | null
  description?: string
  total_lead_days?: number
  fabrication_days?: number
  powder_coat_days?: number
  assembly_days?: number
  testing_days?: number
}

// Removed: PRIORITIES constant - now handled by PrioritySelect

export function PumpDetailModal({ pump, onClose }: PumpDetailModalProps) {
  const {
    updatePump,
    getModelLeadTimes,
    pumps,
    pausePump,
    resumePump,
    capacityConfig,
  } = useApp()

  // Get live pump data from store (prop may be stale)
  const currentPump = useMemo((): Pump | null => {
    if (!pump) return null
    return pumps.find((p) => p.id === pump.id) ?? pump
  }, [pump, pumps])

  const [isEditing, setIsEditing] = useState(false)
  const [isEventHistoryOpen, setIsEventHistoryOpen] = useState(false)
  const [formData, setFormData] = useState<Pump | null>(null)

  // Data sources for dropdowns
  const catalogData = useMemo(() => getCatalogData(), [])

  // Initialize form data when pump opens
  useEffect(() => {
    if (currentPump) {
      setFormData({ ...currentPump })
      setIsEditing(false)
      setIsEventHistoryOpen(false)
    }
  }, [currentPump?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus management for accessibility
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (currentPump) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus the modal after it opens
      requestAnimationFrame(() => {
        modalRef.current?.focus()
      })

      // Cleanup: restore focus when modal closes
      return () => {
        previousFocusRef.current?.focus()
      }
    }
  }, [currentPump?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentPump || !formData) return null

  // Helper to handle input changes
  const handleChange = <K extends keyof Pump>(field: K, value: Pump[K]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  // Helper for nested BOM/LeadTime changes?
  // The Pump type flattens these fields (engine_model, fabrication_days etc aren't directly on Pump type in the snippet I saw earlier,
  // but the instructions say "Shows all data that is generated".
  // Let's check the Pump type definition again.
  // The seed.ts generates them, but are they on the Pump interface?
  // Looking at types.ts: Pump has: id, serial, po, customer, model, stage, priority, powder_color, last_update, value, forecastEnd, forecastStart.
  // It DOES NOT have engine_model, gearbox_model, etc. explicitly in the interface I saw earlier.
  // However, the seed.ts casts it: `as Pump & { engine_model?: string ... }`.
  // So they are likely stored but not strictly typed in the main interface.

  const safeFormData = formData as PumpFormData

  const handleSave = () => {
    if (!formData) return
    updatePump(formData.id, formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (currentPump) setFormData({ ...currentPump })
    setIsEditing(false)
  }

  // Constitution §2.1: ship replaces testing/shipping
  const calculateManHours = (
    days: number | undefined,
    stage: 'fabrication' | 'assembly' | 'ship'
  ) => {
    if (!days) return 0
    const stageConfig = capacityConfig[stage]
    const dailyManHours = stageConfig?.dailyManHours ?? 8
    return Math.round(days * dailyManHours * 10) / 10 // Round to 1 decimal
  }

  // Lead times are stored on the pump object in the "extra" fields from seed.ts?
  // Actually, looking at seed.ts, it puts `total_lead_days` on the pump.
  // But `fabrication_days` etc are NOT explicitly added in seed.ts lines 181-206.
  // Wait, checking seed.ts again...
  // It adds `total_lead_days`.
  // It DOES NOT add `fabrication_days`, `assembly_days` etc. to the pump object.
  // Those are in `model.lead_times`.
  // The instructions say "Department-Specific Work Content... For each pump, the following information exists".
  // If it's not on the pump object, we might need to read it from the Catalog (via getModelLeadTimes) OR
  // if the user edits it, we need to store it on the pump.
  // Since the requirement is to EDIT them, we must assume we want to override the catalog defaults for this specific pump.
  // So we should read from pump if exists, else fallback to catalog.

  const catalogLeadTimes = getModelLeadTimes(formData.model)

  // Helper to get a value (Pump override > Catalog default > 0)
  const getLeadTime = (
    field: keyof PumpFormData,
    catalogField: keyof StageDurations
  ) => {
    return (
      (safeFormData[field] as number) ?? catalogLeadTimes?.[catalogField] ?? 0
    )
  }

  const fabDays = getLeadTime('fabrication_days', 'fabrication')
  const pcDays = getLeadTime('powder_coat_days', 'powder_coat')
  const assemblyDays = getLeadTime('assembly_days', 'assembly')
  const testingDays = getLeadTime('testing_days', 'ship') // Constitution §2.1: ship replaces testing
  const stagedBufferDays = capacityConfig.stagedForPowderBufferDays
  const stagedHistory = getStagedForPowderHistory(
    getPumpStageMoveEvents(currentPump.id)
  )
  const stagedActualDays = stagedHistory.lastEnteredAt
    ? countWorkingDays(
        stagedHistory.lastEnteredAt,
        stagedHistory.lastExitedAt ?? new Date()
      )
    : undefined

  const stageRows = [
    {
      key: 'fabrication_days',
      label: 'Fabrication',
      kind: 'work',
      days: fabDays,
      stage: 'fabrication' as const,
    },
    {
      key: 'staged_for_powder',
      label: 'Staged for Powder',
      kind: 'buffer',
      plannedDays: stagedBufferDays,
      actualDays: stagedActualDays,
    },
    {
      key: 'powder_coat_days',
      label: 'Powder Coat',
      kind: 'vendor',
      days: pcDays,
    },
    {
      key: 'assembly_days',
      label: 'Assembly',
      kind: 'work',
      days: assemblyDays,
      stage: 'assembly' as const,
    },
    {
      key: 'testing_days',
      label: 'Testing/Ship',
      kind: 'work',
      days: testingDays,
      stage: 'ship' as const,
    },
  ] as const

  // Update handler for these specific "extra" fields
  // Update handler for these specific "extra" fields
  const handleExtraChange = (field: string, value: string | number) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return ''
    try {
      return format(parseISO(isoString), 'yyyy-MM-dd')
    } catch {
      return ''
    }
  }

  // Helper for Date Input Change
  // To fix the "0000" year issue, we should allow the input to drive the state directly if possible,
  // but since we store ISO strings, we need to parse.
  // The issue usually happens if we re-format invalid partial dates.
  // We will only update the state if the date is valid or empty.
  const handleDateChange = (field: keyof Pump, value: string) => {
    if (!value) {
      handleChange(field, undefined)
      return
    }
    // Check if it's a full date (YYYY-MM-DD)
    if (value.length === 10) {
      const date = new Date(value)
      if (isValid(date)) {
        handleChange(field, date.toISOString())
      }
    }
    // If partial, we might not want to update the ISO string yet to avoid "0000" jumping?
    // Actually, the input value is controlled by `formatDateForInput(formData.field)`.
    // If we don't update formData, the input will revert to the old value on re-render, preventing typing.
    // So we MUST update formData.
    // But if we update formData with an invalid date, `formatDateForInput` returns "".
    // This clears the input.
    // Solution: We need local state for the date input value while editing, OR we accept that we only update the store on valid dates.
    // But for a controlled input, we need to reflect what the user types.
    // Since `formData` stores the actual Pump data (ISO strings), we can't store "2025-0" in it.
    // We should probably use an uncontrolled input (defaultValue) for the date fields in Edit mode,
    // OR maintain a separate local state for the string value of the date inputs.
    // Let's try `defaultValue` approach for simplicity in this refactor, or just be careful.
    // Actually, `Input` is controlled.
    // Let's just update the ISO string. `new Date("0002-01-01").toISOString()` is valid.
    // The browser handles the typing buffer.
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pump-detail-title"
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl outline-none',
          currentPump.isPaused && 'grayscale-[50%]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* PAUSED stamp - large rubber stamp style */}
        {currentPump.isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-visible">
            <div
              className="border-[5px] border-red-600 rounded-md px-6 py-2 opacity-80 select-none bg-white/20 dark:bg-black/10 backdrop-blur-sm"
              style={{
                transform: 'rotate(-22deg) scale(2)',
              }}
            >
              <span
                className="text-red-600 font-black text-4xl tracking-[0.15em] uppercase"
                style={{
                  fontFamily: 'Impact, Haettenschweiler, sans-serif',
                }}
              >
                PAUSED
              </span>
            </div>
          </div>
        )}

        {/* Header - matches AddPoModal structure */}
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-[5px]">
          <div className="md:flex items-start justify-between">
            <div>
              <h2
                id="pump-detail-title"
                className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                Pump Details
                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 ring-1 ring-inset ring-blue-500/20">
                  {currentPump.serial !== null
                    ? `#${currentPump.serial}`
                    : 'No S/N'}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPump.model} • {currentPump.customer}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {/* Pause/Resume button */}
              {currentPump.stage !== 'QUEUE' &&
                currentPump.stage !== 'CLOSED' &&
                (currentPump.isPaused ? (
                  <button
                    onClick={() => resumePump(currentPump.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                    title="Resume Production"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={() => pausePump(currentPump.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-sm border border-orange-400 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    title="Pause Production"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </button>
                ))}

              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-full flex items-center justify-center border border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-sm font-medium transition-all"
                title="Close"
              >
                Close
              </button>
            </div>
          </div>

          {/* Paused info banner - only show when paused */}
          {currentPump.isPaused && currentPump.pausedAt && (
            <div className="mt-3 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg text-center text-sm text-orange-700 dark:text-orange-400">
              Paused since{' '}
              {format(
                parseISO(currentPump.pausedAt),
                "MMM d, yyyy 'at' h:mm a"
              )}
              {currentPump.totalPausedDays !== undefined &&
                currentPump.totalPausedDays > 0 && (
                  <span className="font-bold">
                    {' '}
                    ({currentPump.totalPausedDays} days total)
                  </span>
                )}
            </div>
          )}
        </div>

        {/* Scrollable Content Area - matches AddPoModal structure */}
        <div className="flex-1 overflow-auto relative bg-muted/5 px-6 py-4">
          <div className="space-y-8 relative z-10">
            {/* TOP TIMELINE MOVED FROM BOTTOM */}
            <div className="relative pt-6 px-1">
              <TimelineProgress
                pump={currentPump}
                blocks={projectPumpTimeline(
                  currentPump,
                  catalogLeadTimes || {
                    fabrication: 0,
                    powder_coat: 0,
                    assembly: 0,
                    ship: 0,
                  },
                  { capacityConfig, stageHistory: stagedHistory }
                )}
              />
            </div>

            {/* 4-Panel Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOP LEFT: Order Information */}
              <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/50 pb-2 mb-3">
                  Order Information
                </h3>
                <div className="space-y-1">
                  {/* PO Number */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      PO Number
                    </span>
                    {isEditing ? (
                      <Input
                        value={formData.po}
                        onChange={(e) => handleChange('po', e.target.value)}
                        className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                      />
                    ) : (
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formData.po}
                      </span>
                    )}
                  </div>
                  {/* Customer */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Customer
                    </span>
                    {isEditing ? (
                      <>
                        <Input
                          list="customers-list"
                          value={formData.customer}
                          onChange={(e) =>
                            handleChange('customer', e.target.value)
                          }
                          className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                        />
                        <datalist id="customers-list">
                          {catalogData.customers.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-foreground truncate max-w-[140px]">
                        {formData.customer}
                      </span>
                    )}
                  </div>
                  {/* Model */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Model
                    </span>
                    {isEditing ? (
                      <>
                        <Input
                          list="models-list"
                          value={formData.model}
                          onChange={(e) =>
                            handleChange('model', e.target.value)
                          }
                          className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                        />
                        <datalist id="models-list">
                          {catalogData.models.map((m) => (
                            <option key={m.model} value={m.model} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {formData.model}
                      </span>
                    )}
                  </div>
                  {/* Color */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Color
                    </span>
                    {isEditing ? (
                      <Input
                        list="colors-list"
                        value={formData.powder_color || ''}
                        onChange={(e) =>
                          handleChange('powder_color', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-white/10"
                          style={{
                            backgroundColor:
                              formData.powder_color || 'hsl(var(--muted))',
                          }}
                        />
                        <span className="text-sm font-bold text-foreground">
                          {formData.powder_color || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP RIGHT: Production Status */}
              <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/50 pb-2 mb-3">
                  Production Status
                </h3>
                <div className="space-y-1">
                  {/* Serial # */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Serial #
                    </span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.serial === null ? '' : formData.serial}
                        onChange={(e) =>
                          handleChange(
                            'serial',
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="Pending"
                        className="bg-muted/30 border-border/50 h-7 w-24 text-right text-sm font-mono"
                      />
                    ) : (
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formData.serial !== null ? (
                          `#${formData.serial}`
                        ) : (
                          <span className="text-amber-500 font-sans text-xs">
                            Unassigned
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {/* Priority */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Priority
                    </span>
                    {isEditing ? (
                      <PrioritySelect
                        value={formData.priority}
                        onChange={(priority) =>
                          handleChange('priority', priority)
                        }
                        size="sm"
                        className="w-28"
                      />
                    ) : (
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium border',
                          formData.priority === 'Urgent' ||
                            formData.priority === 'Rush'
                            ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                            : formData.priority === 'High'
                              ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                              : 'text-muted-foreground bg-muted/20 border-border/50'
                        )}
                      >
                        {formData.priority}
                      </span>
                    )}
                  </div>
                  {/* Stage */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Stage
                    </span>
                    {isEditing ? (
                      <select
                        className="h-7 w-32 rounded-md border border-border/50 bg-muted/30 px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={formData.stage}
                        onChange={(e) =>
                          handleChange('stage', e.target.value as Stage)
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          formData.stage === 'CLOSED'
                            ? 'bg-green-400/10 text-green-400 ring-green-400/20'
                            : formData.stage === 'SHIP'
                              ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'
                              : 'bg-blue-400/10 text-blue-400 ring-blue-400/20'
                        )}
                      >
                        {formData.stage}
                      </span>
                    )}
                  </div>
                  {/* Est. Ship */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Est. Ship
                    </span>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formatDateForInput(formData.forecastEnd)}
                        onChange={(e) =>
                          handleDateChange('forecastEnd', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-28 text-xs"
                      />
                    ) : (
                      <span className="text-sm font-mono font-bold text-foreground">
                        {formData.forecastEnd
                          ? format(parseISO(formData.forecastEnd), 'MMM d')
                          : '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM LEFT: Model Defaults */}
              <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">
                    Model Defaults
                  </h3>
                  {isEditing && (
                    <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="h-3 w-3" />
                      Caution
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {/* Value ($) */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Value ($)
                    </span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.value}
                        onChange={(e) =>
                          handleChange('value', parseFloat(e.target.value))
                        }
                        className="bg-muted/30 border-border/50 h-7 w-24 text-right text-sm font-mono"
                      />
                    ) : (
                      <span className="font-mono text-sm font-bold text-foreground">
                        ${formData.value?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {/* Promise Date */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Promise Date
                    </span>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formatDateForInput(formData.promiseDate)}
                        onChange={(e) =>
                          handleDateChange('promiseDate', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-28 text-xs"
                      />
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {formData.promiseDate
                          ? format(
                              parseISO(formData.promiseDate),
                              'MMM d, yyyy'
                            )
                          : '-'}
                      </span>
                    )}
                  </div>
                  {/* Description */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Description
                    </span>
                    {isEditing ? (
                      <Input
                        value={safeFormData.description || ''}
                        onChange={(e) =>
                          handleExtraChange('description', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-40 text-right text-sm"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                        {safeFormData.description || '-'}
                      </span>
                    )}
                  </div>
                  {/* Engine */}
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      Engine
                    </span>
                    {isEditing ? (
                      <Input
                        value={safeFormData.engine_model || ''}
                        onChange={(e) =>
                          handleExtraChange('engine_model', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {safeFormData.engine_model || '-'}
                      </span>
                    )}
                  </div>
                  {/* Gearbox */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Gearbox
                    </span>
                    {isEditing ? (
                      <Input
                        value={safeFormData.gearbox_model || ''}
                        onChange={(e) =>
                          handleExtraChange('gearbox_model', e.target.value)
                        }
                        className="bg-muted/30 border-border/50 h-7 w-32 text-right text-sm"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {safeFormData.gearbox_model || '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM RIGHT: Department Work Content */}
              <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/50 pb-2 mb-3">
                  Department Work Content
                </h3>
                <div className="space-y-1">
                  {stageRows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0 hover:bg-white/5 transition-colors rounded px-1"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-3">
                        {row.kind === 'buffer' ? (
                          <span className="font-mono text-sm font-bold text-foreground">
                            {row.plannedDays ?? '-'}
                            <span className="text-[10px] text-muted-foreground ml-0.5">
                              D
                            </span>
                          </span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              className="h-6 w-14 text-right bg-muted/30 border-border/50 text-xs font-mono"
                              value={row.days}
                              onChange={(e) =>
                                handleExtraChange(
                                  row.key,
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                            <span className="text-[10px] text-muted-foreground">
                              D
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-sm font-bold text-foreground">
                            {row.days ?? '-'}
                            <span className="text-[10px] text-muted-foreground ml-0.5">
                              D
                            </span>
                          </span>
                        )}
                        <span className="w-16 text-[10px] font-mono text-muted-foreground/70 text-right">
                          {row.kind === 'work' && row.stage
                            ? `${calculateManHours(row.days, row.stage)}H`
                            : row.kind === 'vendor'
                              ? 'WORK DAYS'
                              : row.actualDays !== undefined
                                ? `Act: ${row.actualDays}D`
                                : 'Act: -'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event History Section - Collapsible */}
            <div className="rounded-md border border-border/50 bg-muted/20 overflow-hidden">
              <button
                onClick={() => setIsEventHistoryOpen(!isEventHistoryOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isEventHistoryOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Event History
                  </span>
                </div>
              </button>

              {isEventHistoryOpen && (
                <div className="px-4 pb-4 border-t border-border/50">
                  <EventHistoryTimeline pumpId={currentPump.id} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - matches AddPoModal structure */}
        <div className="flex-shrink-0 border-t border-border bg-muted/40 px-6 py-[5px]">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>System ID: {currentPump.id.split('-')[0]}</span>
            <span>
              Last Updated:{' '}
              {format(new Date(currentPump.last_update), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
