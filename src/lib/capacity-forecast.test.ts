import { describe, it, expect } from 'vitest'
import { buildCapacityForecast } from './capacity-forecast'
import type { CapacityConfig, Pump } from '../types'

const capacityConfig: CapacityConfig = {
  fabrication: {
    employeeCount: 2,
    workDayHours: {
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
      saturday: 0,
      sunday: 0,
    },
    efficiency: 1,
    dailyManHours: 16,
    maxWip: 1,
  },
  assembly: {
    employeeCount: 1,
    workDayHours: {
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
      saturday: 0,
      sunday: 0,
    },
    efficiency: 1,
    dailyManHours: 8,
    maxWip: 2,
  },
  ship: {
    employeeCount: 1,
    workDayHours: {
      monday: 4,
      tuesday: 4,
      wednesday: 4,
      thursday: 4,
      friday: 4,
      saturday: 0,
      sunday: 0,
    },
    efficiency: 1,
    dailyManHours: 4,
    maxWip: 2,
  },
  powderCoat: { vendors: [] },
  stagedForPowderBufferDays: 1,
}

const leadTimeLookup = () => ({
  fabrication: 0,
  powder_coat: 0,
  assembly: 0,
  ship: 0,
})

const workHoursLookup = () => ({
  fabrication: 8,
  assembly: 0,
  ship: 0,
})

describe('capacity forecast', () => {
  it('pauses lowest priority when WIP exceeds capacity', () => {
    const pumps: Pump[] = [
      {
        id: 'p1',
        model: 'M1',
        stage: 'FABRICATION',
        priority: 'High',
        forecastStart: '2026-01-05',
        forecastEnd: undefined,
      } as Pump,
      {
        id: 'p2',
        model: 'M1',
        stage: 'FABRICATION',
        priority: 'Low',
        forecastStart: '2026-01-05',
        forecastEnd: undefined,
      } as Pump,
    ]
    const result = buildCapacityForecast({
      pumps,
      capacityConfig,
      startDate: new Date('2026-01-05'),
      leadTimeLookup,
      workHoursLookup,
    })

    const p1 = result.timelines['p1']
    const p2 = result.timelines['p2']

    expect(p1[0].pausedDays).toBe(0)
    expect(p2[0].pausedDays).toBeGreaterThan(0)
    expect(p1[0].end.getTime()).toBeLessThan(p2[0].end.getTime())
  })

  it('resumes paused jobs as soon as capacity frees', () => {
    const pumps: Pump[] = [
      {
        id: 'p1',
        model: 'M1',
        stage: 'FABRICATION',
        priority: 'High',
        forecastStart: '2026-01-05',
      } as Pump,
      {
        id: 'p2',
        model: 'M1',
        stage: 'FABRICATION',
        priority: 'Low',
        forecastStart: '2026-01-05',
      } as Pump,
    ]

    const result = buildCapacityForecast({
      pumps,
      capacityConfig,
      startDate: new Date('2026-01-05'),
      leadTimeLookup,
      workHoursLookup,
    })

    const p2 = result.timelines['p2']
    expect(p2[0].pausedDays).toBe(1)
  })

  it('skips weekends and holidays when projecting end dates', () => {
    const pumps: Pump[] = [
      {
        id: 'p3',
        model: 'M2',
        stage: 'FABRICATION',
        priority: 'Normal',
        forecastStart: '2026-01-16',
      } as Pump,
    ]

    const result = buildCapacityForecast({
      pumps,
      capacityConfig,
      startDate: new Date('2026-01-16'),
      leadTimeLookup,
      workHoursLookup: () => ({
        fabrication: 32,
        assembly: 0,
        ship: 0,
      }),
    })

    const end = result.timelines['p3'][0].end.toISOString().slice(0, 10)
    expect(end).toBe('2026-01-21')
  })
})
