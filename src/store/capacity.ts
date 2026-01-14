// src/store/capacity.ts
import { eventStore } from '../infrastructure/events/EventStore'
import { lockDateChanged } from '../domain/production/events/LockDateChanged'
import { buildCapacityAwareTimelines } from '../lib/schedule-helper'
import { DEFAULT_CAPACITY_CONFIG } from '../lib/capacity'
import type { CapacityConfig, DepartmentStaffing, PowderCoatVendor, Pump } from '../types'

interface CapacityState {
  lockDate: string | null
  capacityConfig: CapacityConfig
}

interface CapacityActions {
  setLockDate: (date: string | null) => void
  updateDepartmentStaffing: (
    stage: 'fabrication' | 'assembly' | 'ship',
    config: Partial<DepartmentStaffing>
  ) => void
  updatePowderCoatVendor: (vendorId: string, config: Partial<PowderCoatVendor>) => void
  updateStagedForPowderBufferDays: (days: number) => void
  resetCapacityDefaults: () => void
}

export type CapacitySlice = CapacityState & CapacityActions

export const createCapacitySlice = (
  set: (
    partial: Partial<CapacitySlice> | ((state: CapacitySlice) => Partial<CapacitySlice>)
  ) => void,
  get: () => CapacitySlice & {
    pumps: Pump[]
    getModelLeadTimes: (model: string) => number
    updatePump: (id: string, patch: Partial<Pump>) => void
  }
): CapacitySlice => ({
  // Initial state
  lockDate: null,
  capacityConfig: DEFAULT_CAPACITY_CONFIG,

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
})
