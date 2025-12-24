import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Pump,
  Filters,
  AddPoPayload,
  Stage,
  DataAdapter,
  Milestone,
  MicroTask,
} from './types'
import { toast } from 'sonner'
import { LocalAdapter } from './adapters/local'
import { SandboxAdapter } from './adapters/sandbox'
import { SupabaseAdapter } from './adapters/supabase'
import {
  getModelLeadTimes as getCatalogLeadTimes,
  getModelPrice,
} from './lib/seed'
import { addDays, startOfDay, isAfter, parseISO, parse } from 'date-fns'
import { type StageDurations, type StageBlock } from './lib/schedule'
import { buildCapacityAwareTimelines } from './lib/schedule-helper'
import { applyFilters } from './lib/utils'
import { sortPumps, SortDirection, SortField } from './lib/sort'
import type {
  CapacityConfig,
  DepartmentStaffing,
  PowderCoatVendor,
} from './types'
import { DEFAULT_CAPACITY_CONFIG, getStageCapacity } from './lib/capacity'
import { eventStore } from './infrastructure/events/EventStore'
import { getEventBus } from './infrastructure/eventBus/EventBus'
import { pumpStageMoved } from './domain/production/events/PumpStageMoved'
import { pumpPaused } from './domain/production/events/PumpPaused'
import { pumpResumed } from './domain/production/events/PumpResumed'
import { lockDateChanged } from './domain/production/events/LockDateChanged'
import { WORK_STAGES } from './lib/stage-constants'

// --- Store Definition ---

export interface AppState {
  pumps: Pump[]
  filters: Filters
  collapsedStages: Record<Stage, boolean>
  collapsedCards: boolean
  wipLimits: Record<Stage, number | null>
  adapter: DataAdapter
  loading: boolean
  sortField: SortField
  sortDirection: SortDirection
  schedulingStageFilters: Stage[]
  lockDate: string | null // ISO date string
  capacityConfig: CapacityConfig

  // Sandbox State
  isSandbox: boolean
  originalSnapshot: Pump[] | null

  // Progress Engine State
  milestones: Milestone[]
  microTasks: MicroTask[]

  // actions
  setAdapter: (a: DataAdapter) => void
  load: () => Promise<void>
  setFilters: (f: Partial<Filters>) => void
  clearFilters: () => void
  addPO: (payload: AddPoPayload) => void
  moveStage: (id: string, to: Stage) => void
  updatePump: (id: string, patch: Partial<Pump>) => void
  pausePump: (id: string) => void
  resumePump: (id: string) => void
  // Constitution §7: Forecast hint operations (projection only, not truth)
  setForecastHint: (id: string, dropDate: string) => void
  clearForecastHint: (id: string) => void
  clearQueueForecastHints: () => number
  /** @deprecated Use autoSetForecastHints instead */
  levelNotStartedSchedules: () => number
  autoSetForecastHints: () => number
  replaceDataset: (rows: Pump[]) => void
  toggleStageCollapse: (stage: Stage) => void
  toggleCollapsedCards: () => void
  setWipLimit: (stage: Stage, limit: number | null) => void
  setSort: (field: SortField, direction: SortDirection) => void
  toggleSchedulingStageFilter: (stage: Stage) => void
  clearSchedulingStageFilters: () => void
  setLockDate: (date: string | null) => void
  updateDepartmentStaffing: (
    stage: 'fabrication' | 'assembly' | 'ship',
    config: Partial<DepartmentStaffing>
  ) => void
  updatePowderCoatVendor: (
    vendorId: string,
    config: Partial<PowderCoatVendor>
  ) => void
  updateStagedForPowderBufferDays: (days: number) => void
  resetCapacityDefaults: () => void

  // Sandbox Actions
  enterSandbox: () => void
  commitSandbox: () => void
  exitSandbox: () => void

  // Progress Engine Actions
  addMilestone: (m: Milestone) => void
  updateMilestone: (id: string, patch: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  addMicroTask: (t: MicroTask) => void
  toggleMicroTask: (id: string) => void
  deleteMicroTask: (id: string) => void

  // selectors
  filtered: () => Pump[]
  getModelLeadTimes: (model: string) => StageDurations | undefined
  getStageSegments: (id: string) => StageBlock[] | undefined
  isPumpLocked: (id: string) => boolean
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      pumps: [],
      filters: {},
      collapsedStages: {
        QUEUE: false,
        FABRICATION: false,
        STAGED_FOR_POWDER: false,
        POWDER_COAT: false,
        ASSEMBLY: false,
        SHIP: false,
        CLOSED: false,
      } as Record<Stage, boolean>,
      collapsedCards: false,
      wipLimits: {
        QUEUE: null,
        FABRICATION: 8,
        STAGED_FOR_POWDER: null, // Buffer stage, no WIP limit
        POWDER_COAT: 6,
        ASSEMBLY: 8,
        SHIP: 5, // Constitution §2.1: Merged testing+shipping
        CLOSED: null,
      },
      // Logic: Use Supabase if configured, otherwise fallback to Local
      adapter:
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
          ? SupabaseAdapter
          : LocalAdapter,

      loading: true,
      sortField: 'default',
      sortDirection: 'desc',
      schedulingStageFilters: [],
      lockDate: null,
      capacityConfig: DEFAULT_CAPACITY_CONFIG,

      isSandbox: false,
      originalSnapshot: null,

      milestones: [],
      microTasks: [],

      setAdapter: (a) => set({ adapter: a }),

      load: async () => {
        set({ loading: true })
        let rows = await get().adapter.load()

        // Migration: Convert UNSCHEDULED/NOT STARTED to QUEUE
        let migrated = false
        const migratedRows = rows.map((p) => {
          let next = { ...p }

          // Migration 1: Convert UNSCHEDULED/NOT STARTED to QUEUE
          if (
            (next.stage as string) === 'UNSCHEDULED' ||
            (next.stage as string) === 'NOT STARTED'
          ) {
            next.stage = 'QUEUE' as Stage
            migrated = true
          }

          // Migration 2: Backfill missing values
          if (!next.value || next.value === 0) {
            const price = getModelPrice(next.model)
            if (price > 0) {
              next.value = price
              migrated = true
            }
          }

          return next
        })

        if (migrated) {
          // If we migrated, we should probably persist it back immediately or just let the next save handle it.
          // For now, we just load it into state as QUEUE.
          rows = migratedRows
        }

        set({ pumps: rows, loading: false })
      },

      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      clearFilters: () => set({ filters: {} }),

      addPO: ({ po, customer, lines, promiseDate }) => {
        const expanded: Pump[] = lines.flatMap((line) =>
          Array.from({ length: line.quantity || 1 }).map(() => ({
            id: crypto.randomUUID(), // Use valid UUID format for Supabase
            serial: null, // Null for unassigned (DB expects integer)
            po,
            customer,
            model: line.model,
            stage: 'QUEUE' as Stage,
            priority: line.priority ?? 'Normal',
            powder_color: line.color,
            last_update: new Date().toISOString(),
            value: line.valueEach || 0,
            promiseDate: line.promiseDate || promiseDate,
          }))
        )

        const newPumps = [...get().pumps, ...expanded]
        set({ pumps: newPumps })
        get()
          .adapter.upsertMany(expanded)
          .catch((err) => {
            console.error('Failed to persist PO:', err)
            toast.error(
              'Failed to save data to cloud. Please refresh and try again.'
            )
          })
      },

      // Constitution §3: Kanban Truth Rules
      moveStage: (id, to) => {
        // Constitution §3.2: Locks never block Kanban - removed isPumpLocked check

        const pump = get().pumps.find((p) => p.id === id)
        if (!pump) {
          console.warn('Pump not found:', id)
          return
        }

        const fromStage = pump.stage

        // Skip if already in target stage
        if (fromStage === to) {
          return
        }

        // SERIAL GATE: Require user-assigned serial for stages at or after STAGED_FOR_POWDER
        // Null serials are treated as unassigned
        const REQUIRES_SERIAL_STAGES: Stage[] = [
          'STAGED_FOR_POWDER',
          'POWDER_COAT',
          'ASSEMBLY',
          'SHIP',
          'CLOSED',
        ]
        const isUnassignedSerial = pump.serial === null
        if (REQUIRES_SERIAL_STAGES.includes(to) && isUnassignedSerial) {
          toast.error(
            'Serial number required! Click the pump card to assign a serial number before moving to this stage.',
            { duration: 5000 }
          )
          return // Block the move
        }

        const now = new Date().toISOString()

        // 1. Create and persist domain event (TRUTH) with context for ledger
        const event = pumpStageMoved(id, fromStage, to, {
          serial: pump.serial,
          model: pump.model,
          customer: pump.customer,
          po: pump.po,
        })
        eventStore.append(event).catch((err) => {
          console.error('Failed to persist stage move event:', err)
        })

        // Publish to EventBus for subscribers (ledger, etc.)
        getEventBus()
          .publish(event)
          .catch((err) => {
            console.error('Failed to publish stage move event:', err)
          })

        // 2. Check if entering a full WORK stage -> auto-pause (Constitution §3.3)
        let shouldAutoPause = false
        if (WORK_STAGES.includes(to)) {
          const { pumps, wipLimits } = get()
          const wipLimit = wipLimits[to]
          if (wipLimit !== null) {
            // Count ACTIVE (non-paused) pumps in target stage
            const activeInStage = pumps.filter(
              (p) => p.stage === to && !p.isPaused && p.id !== id
            ).length
            shouldAutoPause = activeInStage >= wipLimit
          }
        }

        // 3. Update pump state
        const patch: Partial<Pump> = {
          stage: to,
          last_update: now,
        }

        if (shouldAutoPause) {
          patch.isPaused = true
          patch.pausedAt = now
          patch.pausedStage = to
          // Emit auto-pause event
          const pauseEvent = pumpPaused(id, to, 'auto')
          eventStore.append(pauseEvent).catch((err) => {
            console.error('Failed to persist pause event:', err)
          })
        }

        const newPumps = get().pumps.map((p) =>
          p.id === id ? { ...p, ...patch } : p
        )
        set({ pumps: newPumps })

        // 4. Persist to adapter
        get()
          .adapter.update(id, patch)
          .catch((err) => {
            console.error('Failed to persist stage move:', err)
            toast.error(
              'Failed to save stage move. Data may be desynchronized.'
            )
          })
      },

      updatePump: (id, patch) => {
        const now = new Date().toISOString()
        const newPumps = get().pumps.map((p) =>
          p.id === id ? { ...p, ...patch, last_update: now } : p
        )
        set({ pumps: newPumps })
        get()
          .adapter.update(id, { ...patch, last_update: now })
          .catch((err) => {
            console.error('Failed to update pump:', err)
            toast.error('Failed to save changes. Please check your connection.')
          })
      },

      // Constitution §3.3: Pause is truth
      pausePump: (id, reason: 'auto' | 'manual' = 'manual') => {
        const pump = get().pumps.find((p) => p.id === id)
        if (!pump || pump.isPaused) return

        const now = new Date().toISOString()

        // Emit domain event
        const event = pumpPaused(id, pump.stage, reason)
        eventStore.append(event).catch((err) => {
          console.error('Failed to persist pause event:', err)
        })

        const patch: Partial<Pump> = {
          isPaused: true,
          pausedAt: now,
          pausedStage: pump.stage,
          last_update: now,
        }

        get().updatePump(id, patch)
      },

      // Constitution §3.3: Unpause blocked if would exceed capacity
      resumePump: (id) => {
        const pump = get().pumps.find((p) => p.id === id)
        if (!pump || !pump.isPaused) return

        // Constitution §3.3: Block resume if it would exceed WIP limit
        if (WORK_STAGES.includes(pump.stage)) {
          const { pumps, wipLimits } = get()
          const wipLimit = wipLimits[pump.stage]
          if (wipLimit !== null) {
            const activeInStage = pumps.filter(
              (p) => p.stage === pump.stage && !p.isPaused && p.id !== id
            ).length
            if (activeInStage >= wipLimit) {
              console.warn(
                `Cannot resume pump ${id}: Stage ${pump.stage} at WIP limit (${activeInStage}/${wipLimit})`
              )
              return // Block resume
            }
          }
        }

        const now = new Date()
        const pausedAt = pump.pausedAt ? new Date(pump.pausedAt) : now
        const pausedDays = Math.floor(
          (now.getTime() - pausedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        const totalPaused = (pump.totalPausedDays || 0) + pausedDays

        // Emit domain event
        const event = pumpResumed(id, pump.stage, pausedDays)
        eventStore.append(event).catch((err) => {
          console.error('Failed to persist resume event:', err)
        })

        const patch: Partial<Pump> = {
          isPaused: false,
          pausedAt: undefined,
          totalPausedDays: totalPaused,
          last_update: now.toISOString(),
        }

        get().updatePump(id, patch)
      },

      // Constitution §7: Set forecast hint (projection only)
      setForecastHint: (id, dropDate) => {
        // When dropping on calendar, we set stage to QUEUE (conceptually "Scheduled Queue")
        // The distinction is purely whether forecastStart is set.
        const pump = get().pumps.find((p) => p.id === id)
        if (!pump) return

        // Calculate end date based on lead time
        const leadTimes = get().getModelLeadTimes(pump.model)
        if (!leadTimes) return

        const capacityConfig = get().capacityConfig

        // Parse dropDate as local date (YYYY-MM-DD)
        const parsedDate = parse(dropDate, 'yyyy-MM-dd', new Date())
        const updatedPumps = get().pumps.map((p) =>
          p.id === id
            ? { ...p, forecastStart: startOfDay(parsedDate).toISOString() }
            : p
        )
        const timelines = leadTimes
          ? buildCapacityAwareTimelines(
              updatedPumps,
              capacityConfig,
              get().getModelLeadTimes
            )
          : {}
        const timeline = timelines[id] ?? []
        const end =
          timeline.length > 0
            ? timeline[timeline.length - 1].end
            : addDays(startOfDay(parsedDate), 1)
        const start =
          timeline.length > 0 ? timeline[0].start : startOfDay(parsedDate)

        const patch: Partial<Pump> = {
          stage: 'QUEUE', // Ensure it's in QUEUE
          forecastStart: start.toISOString(),
          forecastEnd: end.toISOString(),
          last_update: new Date().toISOString(),
        }

        get().updatePump(id, patch)
      },

      // Constitution §7: Clear forecast hint
      clearForecastHint: (id) => {
        const patch: Partial<Pump> = {
          stage: 'QUEUE',
          forecastStart: undefined,
          forecastEnd: undefined,
          last_update: new Date().toISOString(),
        }
        get().updatePump(id, patch)
      },

      // Constitution §7: Clear queue forecast hints
      clearQueueForecastHints: () => {
        const { pumps, lockDate, updatePump } = get()
        let count = 0

        pumps.forEach((p) => {
          if (p.stage === 'QUEUE' && p.forecastStart) {
            // Check lock date
            if (
              lockDate &&
              !isAfter(parseISO(p.forecastStart), parseISO(lockDate))
            ) {
              return // Skip locked items
            }

            updatePump(p.id, {
              forecastStart: undefined,
              forecastEnd: undefined,
              last_update: new Date().toISOString(),
            })
            count++
          }
        })
        return count
      },

      /** @deprecated Use autoSetForecastHints instead */
      levelNotStartedSchedules: () => {
        return get().autoSetForecastHints()
      },

      // Constitution §7: Auto-set forecast hints for unscheduled queue items
      autoSetForecastHints: () => {
        const {
          pumps,
          updatePump,
          getModelLeadTimes,
          lockDate,
          capacityConfig,
        } = get()

        // 1. Get un-scheduled pumps
        const unscheduled = pumps.filter(
          (p) => p.stage === 'QUEUE' && !p.forecastStart
        )
        if (unscheduled.length === 0) return 0

        // 2. Sort by Priority then Due Date
        const priorityWeight = {
          Urgent: 4,
          Rush: 3,
          High: 2,
          Normal: 1,
          Low: 0,
        }

        const sorted = [...unscheduled].sort((a, b) => {
          const pA = priorityWeight[a.priority] ?? 1
          const pB = priorityWeight[b.priority] ?? 1
          if (pA !== pB) return pB - pA // Higher priority first

          // If same priority, sooner promiseDate first
          if (a.promiseDate && b.promiseDate) {
            return a.promiseDate.localeCompare(b.promiseDate)
          }
          return 0
        })

        // 3. Build capacity map using employee-based capacity
        // Calculate weekly capacity for fabrication (start stage)
        // Fabrication typically takes ~4 days per pump (3-5 days range)
        // With 4 employees, this gives ~4-5 pumps/week capacity
        const fabWeeklyCapacity = getStageCapacity(
          'FABRICATION',
          capacityConfig,
          4
        )
        // Daily capacity is roughly weekly / 5 work days (excluding weekends)
        const fabDailyCapacity = Math.max(1, Math.ceil(fabWeeklyCapacity / 5))

        // Seed capacity with existing scheduled jobs
        // We need to know how many jobs are starting on each day
        const dailyStarts: Record<string, number> = {}

        pumps.forEach((p) => {
          if (p.forecastStart) {
            const dateKey = p.forecastStart.split('T')[0]
            dailyStarts[dateKey] = (dailyStarts[dateKey] || 0) + 1
          }
        })

        let scheduledCount = 0
        const forecastStarts: Record<string, string> = {}
        const today = new Date()

        // Determine start date for autoscheduling
        let searchStartDate = today
        if (lockDate) {
          const lock = parseISO(lockDate)
          if (isAfter(lock, today)) {
            searchStartDate = addDays(lock, 1)
          }
        }

        // 4. Assign dates
        sorted.forEach((pump) => {
          // Find first day with capacity < fabDailyCapacity
          let dayOffset = 0
          let foundDate = false
          let targetDateStr = ''

          while (!foundDate && dayOffset < 365) {
            // Cap at 1 year lookahead
            const targetDate = addDays(searchStartDate, dayOffset)
            const dateKey = targetDate.toISOString().split('T')[0]
            const currentLoad = dailyStarts[dateKey] || 0

            if (currentLoad < fabDailyCapacity) {
              foundDate = true
              targetDateStr = dateKey
              dailyStarts[dateKey] = currentLoad + 1
            } else {
              dayOffset++
            }
          }

          if (foundDate) {
            forecastStarts[pump.id] = targetDateStr
            scheduledCount++
          }
        })

        if (scheduledCount > 0) {
          const updatedPumps = pumps.map((pump) =>
            forecastStarts[pump.id]
              ? {
                  ...pump,
                  forecastStart: startOfDay(
                    new Date(forecastStarts[pump.id])
                  ).toISOString(),
                }
              : pump
          )

          const timelines = buildCapacityAwareTimelines(
            updatedPumps,
            capacityConfig,
            getModelLeadTimes
          )

          Object.entries(forecastStarts).forEach(([pumpId]) => {
            const timeline = timelines[pumpId]
            if (!timeline || timeline.length === 0) return
            const start = timeline[0].start
            const end = timeline[timeline.length - 1].end

            updatePump(pumpId, {
              forecastStart: start.toISOString(),
              forecastEnd: end.toISOString(),
              last_update: new Date().toISOString(),
            })
          })
        }

        return scheduledCount
      },

      replaceDataset: (rows) => {
        set({ pumps: rows })
        get().adapter.replaceAll(rows)
      },

      toggleStageCollapse: (stage) =>
        set((state) => ({
          collapsedStages: {
            ...state.collapsedStages,
            [stage]: !state.collapsedStages[stage],
          },
        })),

      toggleCollapsedCards: () =>
        set((state) => ({ collapsedCards: !state.collapsedCards })),

      setWipLimit: (stage, limit) =>
        set((state) => ({
          wipLimits: { ...state.wipLimits, [stage]: limit },
        })),

      setSort: (field, direction) =>
        set({ sortField: field, sortDirection: direction }),

      toggleSchedulingStageFilter: (stage) =>
        set((state) => {
          const current = state.schedulingStageFilters
          const next = current.includes(stage)
            ? current.filter((s) => s !== stage)
            : [...current, stage]
          return { schedulingStageFilters: next }
        }),

      clearSchedulingStageFilters: () => set({ schedulingStageFilters: [] }),

      // Constitution §7: Lock date affects forecast only, never truth
      setLockDate: (date) => {
        const previousLockDate = get().lockDate
        // Skip if no change
        if (previousLockDate === date) return

        // Emit domain event
        const event = lockDateChanged(previousLockDate, date)
        eventStore.append(event).catch((err) => {
          console.error('Failed to persist lock date change event:', err)
        })

        set({ lockDate: date })
      },

      // Capacity management actions
      updateDepartmentStaffing: (stage, config) =>
        set((state) => {
          const current = state.capacityConfig[stage]
          const newConfig = { ...current, ...config }

          // Reactive Logic:
          // 1. If Employee Count changed -> Recalc Daily Man-Hours
          if (
            config.employeeCount !== undefined &&
            config.employeeCount !== current.employeeCount
          ) {
            newConfig.dailyManHours =
              newConfig.employeeCount * 8 * newConfig.efficiency
          }
          // 2. If Efficiency changed -> Recalc Daily Man-Hours
          else if (
            config.efficiency !== undefined &&
            config.efficiency !== current.efficiency
          ) {
            newConfig.dailyManHours =
              newConfig.employeeCount * 8 * newConfig.efficiency
          }
          // 3. If Daily Man-Hours changed -> Recalc Efficiency (keep employees constant)
          else if (
            config.dailyManHours !== undefined &&
            config.dailyManHours !== current.dailyManHours
          ) {
            // efficiency = dailyManHours / (employees * 8)
            const denom = newConfig.employeeCount * 8
            if (denom > 0) {
              newConfig.efficiency = newConfig.dailyManHours / denom
            }
          }

          return {
            capacityConfig: {
              ...state.capacityConfig,
              [stage]: newConfig,
            },
          }
        }),

      updatePowderCoatVendor: (vendorId, config) =>
        set((state) => ({
          capacityConfig: {
            ...state.capacityConfig,
            powderCoat: {
              vendors: state.capacityConfig.powderCoat.vendors.map((vendor) =>
                vendor.id === vendorId ? { ...vendor, ...config } : vendor
              ),
            },
          },
        })),

      updateStagedForPowderBufferDays: (days) => {
        const normalized = Math.max(0, Math.floor(days))
        const nextCapacityConfig = {
          ...get().capacityConfig,
          stagedForPowderBufferDays: normalized,
        }

        set({ capacityConfig: nextCapacityConfig })

        const { pumps, getModelLeadTimes } = get()
        const timelines = buildCapacityAwareTimelines(
          pumps,
          nextCapacityConfig,
          getModelLeadTimes
        )

        pumps.forEach((pump) => {
          if (!pump.forecastStart) return
          const timeline = timelines[pump.id]
          if (!timeline || timeline.length === 0) return

          const startISO = timeline[0].start.toISOString()
          const endISO = timeline[timeline.length - 1].end.toISOString()

          if (pump.forecastStart === startISO && pump.forecastEnd === endISO) {
            return
          }

          get().updatePump(pump.id, {
            forecastStart: startISO,
            forecastEnd: endISO,
          })
        })
      },

      resetCapacityDefaults: () =>
        set({ capacityConfig: DEFAULT_CAPACITY_CONFIG }),

      // Sandbox Actions
      enterSandbox: () => {
        const state = get()
        if (state.isSandbox) return
        set({
          isSandbox: true,
          originalSnapshot: [...state.pumps],
          adapter: SandboxAdapter,
        })
      },

      commitSandbox: () => {
        const state = get()
        if (!state.isSandbox) return

        // Restore LocalAdapter
        // If we were in Cloud Mode, we should restore SupabaseAdapter?
        // Actually, commitSandbox logic implies persisting TO the real adapter.
        // We need to fetch the *configured* adapter, not hardcode LocalAdapter.
        // For now, let's just re-evaluate env vars or store 'realAdapter' in state.
        // Simplified: Re-check env vars.
        const realAdapter =
          import.meta.env.VITE_SUPABASE_URL &&
          import.meta.env.VITE_SUPABASE_ANON_KEY
            ? SupabaseAdapter
            : LocalAdapter

        // Persist current state to real adapter
        realAdapter.replaceAll(state.pumps)

        set({
          isSandbox: false,
          originalSnapshot: null,
          adapter: realAdapter,
        })
      },

      exitSandbox: () => {
        const state = get()
        if (!state.isSandbox || !state.originalSnapshot) return

        const realAdapter =
          import.meta.env.VITE_SUPABASE_URL &&
          import.meta.env.VITE_SUPABASE_ANON_KEY
            ? SupabaseAdapter
            : LocalAdapter

        set({
          isSandbox: false,
          pumps: state.originalSnapshot,
          originalSnapshot: null,
          adapter: realAdapter,
        })
      },

      // Progress Engine Actions
      addMilestone: (m) =>
        set((state) => ({ milestones: [...state.milestones, m] })),

      updateMilestone: (id, patch) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      deleteMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
          microTasks: state.microTasks.filter((t) => t.milestoneId !== id),
        })),

      addMicroTask: (t) =>
        set((state) => ({ microTasks: [...state.microTasks, t] })),

      toggleMicroTask: (id) =>
        set((state) => ({
          microTasks: state.microTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isComplete: !t.isComplete,
                  completedAt: !t.isComplete
                    ? new Date().toISOString()
                    : undefined,
                }
              : t
          ),
        })),

      deleteMicroTask: (id) =>
        set((state) => ({
          microTasks: state.microTasks.filter((t) => t.id !== id),
        })),

      filtered: () => {
        const { pumps, filters, sortField, sortDirection } = get()
        const filtered = applyFilters(pumps, filters)
        return sortPumps(filtered, sortField, sortDirection)
      },

      getModelLeadTimes: (model) => getCatalogLeadTimes(model),

      getStageSegments: (id) => {
        const { pumps, capacityConfig, getModelLeadTimes } = get()
        // This is expensive to re-calc on every render if called often.
        // Ideally should be memoized or computed once per pump update.
        // For now, calculating on fly.
        const pump = pumps.find((p) => p.id === id)
        if (!pump || !pump.forecastStart) return undefined

        // We need to rebuild just for this pump, but capacity awareness requires global context.
        // So we might need to rely on the global buildCapacityAwareTimelines
        const timelines = buildCapacityAwareTimelines(
          pumps,
          capacityConfig,
          getModelLeadTimes
        )
        return timelines[id]
      },

      isPumpLocked: (id) => {
        const { pumps, lockDate } = get()
        if (!lockDate) return false
        const pump = pumps.find((p) => p.id === id)
        if (!pump || !pump.forecastStart) return false
        return !isAfter(parseISO(pump.forecastStart), parseISO(lockDate))
      },
    }),
    {
      name: 'pumptracker-storage',
      // We only persist UI state details here, NOT the pumps themselves if we are using an adapter
      // Wait, Zustand persist middleware saves *everything* to localStorage by default.
      // If we use SupabaseAdapter, we might NOT want to persist `pumps` to localStorage to avoid desync/double-truth.
      // However, for "Lite", local-first with sync is complex.
      // The current architecture treats `pumps` array in memory as truth, and `adapter` as backing store.
      // `persist` middleware here might conflict or be redundant.
      // If `load()` fetches from adapter on mount, we don't need `persist` for `pumps`.
      // Let's refine the partializer to only save UI preferences.
      merge: (persistedState, currentState) => {
        const parsed = persistedState as Partial<AppState>
        return {
          ...currentState,
          ...parsed,
          capacityConfig: {
            ...currentState.capacityConfig,
            ...(parsed.capacityConfig || {}),
          },
        }
      },
      partialize: (state) => ({
        // Persist preferences
        filters: state.filters,
        collapsedStages: state.collapsedStages,
        collapsedCards: state.collapsedCards,
        wipLimits: state.wipLimits,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        capacityConfig: state.capacityConfig,
        schedulingStageFilters: state.schedulingStageFilters,
        lockDate: state.lockDate,
        // Do NOT persist pumps or adapter state; let load() handle it.
      }),
    }
  )
)
