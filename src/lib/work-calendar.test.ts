import { describe, it, expect } from 'vitest'
import {
  isWorkingDay,
  countWorkingDays,
  buildUsFederalHolidays,
} from './work-calendar'

const holidays2026 = buildUsFederalHolidays(2026)

describe('work-calendar', () => {
  it('treats weekends and holidays as non-working', () => {
    expect(isWorkingDay(new Date('2026-01-10'), holidays2026)).toBe(false) // Saturday
    expect(isWorkingDay(new Date('2026-01-19'), holidays2026)).toBe(false) // MLK Day
    expect(isWorkingDay(new Date('2026-01-20'), holidays2026)).toBe(true)
  })

  it('counts working days excluding weekends and holidays', () => {
    const start = new Date('2026-01-15')
    const end = new Date('2026-01-22')
    // 16(Fri), 20(Tue), 21(Wed), 22(Thu) => 4 days
    expect(countWorkingDays(start, end, holidays2026)).toBe(4)
  })
})
