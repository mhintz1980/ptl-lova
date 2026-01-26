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

const pumps: Pump[] = [
  {
    id: 'p1',
    model: 'M1',
    stage: 'FABRICATION',
    priority: 'HIGH',
    forecastStart: '2026-01-05',
    forecastEnd: undefined,
  } as Pump,
  {
    id: 'p2',
    model: 'M1',
    stage: 'FABRICATION',
    priority: 'LOW',
    forecastStart: '2026-01-05',
    forecastEnd: undefined,
  } as Pump,
]

describe('capacity forecast', () => {
  it('pauses lowest priority when WIP exceeds capacity', () => {
    const result = buildCapacityForecast({
      pumps,
      capacityConfig,
      startDate: new Date('2026-01-05'),
    })

    const p1 = result.timelines['p1']
    const p2 = result.timelines['p2']

    expect(p1[0].pausedDays).toBe(0)
    expect(p2[0].pausedDays).toBeGreaterThan(0)
    expect(p1[0].end.getTime()).toBeLessThan(p2[0].end.getTime())
  })
})
