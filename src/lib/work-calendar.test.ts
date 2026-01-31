import { describe, it, expect } from 'vitest'
import {
  isWorkingDay,
  countWorkingDays,
  buildUsFederalHolidays,
} from './work-calendar'

const holidays2026 = buildUsFederalHolidays(2026)
const holidays2027 = buildUsFederalHolidays(2027)

describe('work-calendar', () => {
  it('treats weekends and holidays as non-working', () => {
    expect(isWorkingDay(new Date('2026-01-10'), holidays2026)).toBe(false) // Saturday
    expect(isWorkingDay(new Date('2026-01-19'), holidays2026)).toBe(false) // MLK Day
    expect(isWorkingDay(new Date('2026-01-20'), holidays2026)).toBe(true)
  })

  it('counts working days excluding weekends and holidays', () => {
    const start = new Date('2026-01-15')
    const end = new Date('2026-01-22')
    // 15(Thu), 16(Fri), 20(Tue), 21(Wed), 22(Thu) => 5 days
    expect(countWorkingDays(start, end, holidays2026)).toBe(5)
  })

  it('computes observed and movable federal holidays', () => {
    expect(holidays2026.has('2026-07-03')).toBe(true) // Observed Independence Day
    expect(holidays2026.has('2026-01-19')).toBe(true) // MLK Day (3rd Mon Jan)
    expect(holidays2027.has('2027-11-25')).toBe(true) // Thanksgiving (4th Thu Nov)
  })

  it('includes observed New Year from adjacent year when Jan 1 is Saturday', () => {
    const holidays2021 = buildUsFederalHolidays(2021)
    expect(holidays2021.has('2021-12-31')).toBe(true)
  })

  it('handles boundary conditions for day counting', () => {
    // End before Start -> 0
    expect(
      countWorkingDays(
        new Date('2026-01-20'),
        new Date('2026-01-19'),
        holidays2026
      )
    ).toBe(0)

    // Start == End (Working Day) -> 1
    expect(
      countWorkingDays(
        new Date('2026-01-20'),
        new Date('2026-01-20'),
        holidays2026
      )
    ).toBe(1)

    // Start == End (Weekend) -> 0
    expect(
      countWorkingDays(
        new Date('2026-01-18'), // Sunday
        new Date('2026-01-18'),
        holidays2026
      )
    ).toBe(0)
  })
})
