import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from './store'
import { DEFAULT_CAPACITY_CONFIG, getStageCapacity } from './lib/capacity'
import { buildCapacityAwareTimelines } from './lib/schedule-helper'
import { eventStore } from './infrastructure/events/EventStore'
import { pumpStageMoved } from './domain/production/events/PumpStageMoved'

describe('Department Staffing Logic', () => {
  beforeEach(() => {
    useApp.getState().resetCapacityDefaults()
  })

  it('should initialize with default values', () => {
    const { capacityConfig } = useApp.getState()
    const fab = capacityConfig.fabrication
    const ship = capacityConfig.ship

    // Constitution §2.1: Merged testing+shipping into ship
    expect(fab.employeeCount).toBe(4)
    expect(fab.efficiency).toBe(0.875)
    expect(fab.dailyManHours).toBe(28) // 4 * 8 * 0.875

    expect(ship.employeeCount).toBe(0.56) // Combined testing (0.28) + shipping (0.28)
    expect(ship.dailyManHours).toBe(4) // Combined 2 + 2
  })

  it('should update dailyManHours when employeeCount changes (decimal)', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { employeeCount: 2.5 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.employeeCount).toBe(2.5)
    expect(fab.dailyManHours).toBeCloseTo(2.5 * 8 * 0.875) // ~17.5
  })

  it('should update dailyManHours when employeeCount changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { employeeCount: 10 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.employeeCount).toBe(10)
    expect(fab.dailyManHours).toBeCloseTo(10 * 8 * 0.875) // 70
  })

  it('should update dailyManHours when efficiency changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { efficiency: 1.0 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.efficiency).toBe(1.0)
    expect(fab.dailyManHours).toBeCloseTo(4 * 8 * 1.0) // 32
  })

  it('should update efficiency when dailyManHours changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    // Set man hours to 16 (which for 4 employees * 8 hours = 32 capacity, means 50% efficiency)
    updateDepartmentStaffing('fabrication', { dailyManHours: 16 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.dailyManHours).toBe(16)
    expect(fab.efficiency).toBeCloseTo(0.5)
  })

  it('should calculate correct weekly capacity', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    // Default: 4 employees * 8 hours * 0.85 eff = 27.2 daily man hours
    // Weekly man hours = 27.2 * 5 = 136
    // Man hours per pump (Fab) = 4 days * 8 hours = 32
    // Capacity = floor(136 / 32) = 4 pumps/week

    const config = useApp.getState().capacityConfig
    const cap = getStageCapacity('FABRICATION', config)
    expect(cap).toBe(4)

    // Increase employees to 8
    // Daily = 8 * 8 * 0.85 = 54.4
    // Weekly = 272
    // Capacity = floor(272 / 32) = 8.5 -> 8 pumps/week
    updateDepartmentStaffing('fabrication', { employeeCount: 8 })
    const config2 = useApp.getState().capacityConfig
    const cap2 = getStageCapacity('FABRICATION', config2)
    expect(cap2).toBe(8)
  })

  it('treats missing stagedForPowderBufferDays as default without persisting', async () => {
    const persisted = {
      state: {
        capacityConfig: {
          ...DEFAULT_CAPACITY_CONFIG,
        },
      },
      version: 0,
    }
    delete persisted.state.capacityConfig.stagedForPowderBufferDays
    localStorage.setItem('pumptracker-storage', JSON.stringify(persisted))

    await useApp.persist.rehydrate()

    const { capacityConfig } = useApp.getState()
    expect(capacityConfig.stagedForPowderBufferDays).toBe(1)

    const raw = localStorage.getItem('pumptracker-storage')
    const stored = raw ? JSON.parse(raw) : null
    expect(
      stored?.state?.capacityConfig?.stagedForPowderBufferDays
    ).toBeUndefined()
  })

  it('recalculates forecasts when buffer changes and respects completion history', async () => {
    await eventStore.clear()
    useApp.getState().resetCapacityDefaults()

    const baseStart = new Date('2025-01-06T00:00:00.000Z')
    const pump1 = {
      id: 'pump-forecast-1',
      serial: 1201,
      po: 'PO-1',
      customer: 'Customer A',
      model: 'DD-6',
      stage: 'QUEUE' as const,
      priority: 'Normal' as const,
      last_update: baseStart.toISOString(),
      value: 1000,
      forecastStart: baseStart.toISOString(),
    }
    const pump2 = {
      ...pump1,
      id: 'pump-forecast-2',
      serial: 1202,
    }

    await eventStore.append(
      pumpStageMoved(pump2.id, 'STAGED_FOR_POWDER', 'POWDER_COAT')
    )

    const { capacityConfig, getModelLeadTimes } = useApp.getState()
    const initialTimelines = buildCapacityAwareTimelines(
      [pump1, pump2],
      capacityConfig,
      getModelLeadTimes
    )
    const withForecasts = [pump1, pump2].map((pump) => {
      const timeline = initialTimelines[pump.id]
      return {
        ...pump,
        forecastEnd: timeline?.at(-1)?.end.toISOString(),
      }
    })

    useApp.getState().replaceDataset(withForecasts)

    const before = useApp.getState().pumps.reduce<Record<string, string | undefined>>(
      (acc, pump) => ({ ...acc, [pump.id]: pump.forecastEnd }),
      {}
    )

    useApp.getState().updateStagedForPowderBufferDays(3)

    const after = useApp.getState().pumps.reduce<Record<string, string | undefined>>(
      (acc, pump) => ({ ...acc, [pump.id]: pump.forecastEnd }),
      {}
    )

    expect(after[pump1.id]).not.toBe(before[pump1.id])
    expect(after[pump2.id]).toBe(before[pump2.id])
  })
})
