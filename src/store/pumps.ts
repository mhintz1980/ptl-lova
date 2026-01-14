import { StateCreator } from 'zustand'
import { Pump, AddPoPayload, Stage } from '../types'
import { DataAdapter } from '../types'
import { eventStore } from '../infrastructure/events/EventStore'
import { getEventBus } from '../infrastructure/eventBus/EventBus'
import { pumpStageMoved } from '../domain/production/events/PumpStageMoved'
import { pumpPaused } from '../domain/production/events/PumpPaused'
import { pumpResumed } from '../domain/production/events/PumpResumed'
import { toast } from 'sonner'
import { WORK_STAGES } from '../lib/stage-constants'

export interface PumpSlice {
  pumps: Pump[]
  adapter: DataAdapter

  // Actions
  addPO: (payload: AddPoPayload) => Promise<void>
  moveStage: (id: string, to: Stage) => void
  updatePump: (id: string, patch: Partial<Pump>) => void
  pausePump: (id: string) => void
  resumePump: (id: string) => void
  replaceDataset: (rows: Pump[]) => void

  // Selectors
  filtered: (filters: Record<string, unknown>) => Pump[]
}

export const createPumpSlice: StateCreator<
  PumpSlice & {
    wipLimits: Record<Stage, number | null>
  },
  [],
  [],
  PumpSlice
> = (set, get) => ({
  pumps: [],
  adapter: (undefined as unknown) as DataAdapter,

  addPO: async ({ po, customer, lines, promiseDate, dateReceived }) => {
    const expanded: Pump[] = lines.flatMap((line) =>
      Array.from({ length: line.quantity || 1 }).map(() => ({
        id: crypto.randomUUID(),
        serial: null,
        po,
        customer,
        model: line.model,
        stage: 'QUEUE' as Stage,
        priority: line.priority ?? 'Normal',
        powder_color: line.color,
        last_update: new Date().toISOString(),
        value: line.valueEach || 0,
        promiseDate: line.promiseDate || promiseDate,
        dateReceived: dateReceived,
      }))
    )

    const newPumps = [...get().pumps, ...expanded]
    set({ pumps: newPumps })
    await get().adapter.upsertMany(expanded)
  },

  moveStage: (id, to) => {
    const pump = get().pumps.find((p) => p.id === id)
    if (!pump) {
      console.warn('Pump not found:', id)
      return
    }

    const fromStage = pump.stage

    if (fromStage === to) {
      return
    }

    // SERIAL GATE: Require user-assigned serial for stages at or after STAGED_FOR_POWDER
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
      return
    }

    const now = new Date().toISOString()

    // Emit domain event
    const event = pumpStageMoved(id, fromStage, to, {
      serial: pump.serial,
      model: pump.model,
      customer: pump.customer,
      po: pump.po,
    })
    eventStore.append(event).catch((err) => {
      console.error('Failed to persist stage move event:', err)
    })

    getEventBus()
      .publish(event)
      .catch((err) => {
        console.error('Failed to publish stage move event:', err)
      })

    // Auto-pause if entering full WORK stage
    let shouldAutoPause = false
    if (WORK_STAGES.includes(to)) {
      const { pumps, wipLimits } = get() as {
        pumps: Pump[]
        wipLimits: Record<Stage, number | null>
      }
      const wipLimit = wipLimits[to]
      if (wipLimit !== null) {
        const activeInStage = pumps.filter(
          (p) => p.stage === to && !p.isPaused && p.id !== id
        ).length
        shouldAutoPause = activeInStage >= wipLimit
      }
    }

    const patch: Partial<Pump> = {
      stage: to,
      last_update: now,
    }

    if (shouldAutoPause) {
      patch.isPaused = true
      patch.pausedAt = now
      patch.pausedStage = to
      const pauseEvent = pumpPaused(id, to, 'auto')
      eventStore.append(pauseEvent).catch((err) => {
        console.error('Failed to persist pause event:', err)
      })
    }

    const newPumps = get().pumps.map((p) =>
      p.id === id ? { ...p, ...patch } : p
    )
    set({ pumps: newPumps })

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

  pausePump: (id) => {
    const pump = get().pumps.find((p) => p.id === id)
    if (!pump || pump.isPaused) return

    const now = new Date().toISOString()

    const event = pumpPaused(id, pump.stage, 'manual')
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

  resumePump: (id) => {
    const pump = get().pumps.find((p) => p.id === id)
    if (!pump || !pump.isPaused) return

    // Check WIP limit
    if (WORK_STAGES.includes(pump.stage)) {
      const { pumps, wipLimits } = get() as {
        pumps: Pump[]
        wipLimits: Record<Stage, number | null>
      }
      const wipLimit = wipLimits[pump.stage]
      if (wipLimit !== null) {
        const activeInStage = pumps.filter(
          (p) => p.stage === pump.stage && !p.isPaused && p.id !== id
        ).length
        if (activeInStage >= wipLimit) {
          console.warn(
            `Cannot resume pump ${id}: Stage ${pump.stage} at WIP limit (${activeInStage}/${wipLimit})`
          )
          return
        }
      }
    }

    const now = new Date()
    const pausedAt = pump.pausedAt ? new Date(pump.pausedAt) : now
    const pausedDays = Math.floor(
      (now.getTime() - pausedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const totalPaused = (pump.totalPausedDays || 0) + pausedDays

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

  replaceDataset: (rows) => {
    set({ pumps: rows })
    get().adapter.replaceAll(rows)
  },

  filtered: (filters) => {
    const { pumps } = get()
    // TODO: Import and use applyFilters from lib/utils
    // For now, returning unfiltered pumps
    return pumps
  },
})
