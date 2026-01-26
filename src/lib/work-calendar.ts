export type HolidaySet = Set<string>

const MS_PER_DAY = 24 * 60 * 60 * 1000

const normalizeUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

export const toIsoDay = (date: Date) => date.toISOString().split('T')[0]

export function buildUsFederalHolidays(year: number): HolidaySet {
  // Minimal list for current year; expand later if needed.
  const dates = [
    `${year}-01-01`, // New Year's Day
    `${year}-01-19`, // MLK Day (2026)
    `${year}-02-16`, // Presidents' Day (2026)
    `${year}-05-25`, // Memorial Day (2026)
    `${year}-06-19`, // Juneteenth (2026)
    `${year}-07-04`, // Independence Day (2026)
    `${year}-09-07`, // Labor Day (2026)
    `${year}-10-12`, // Columbus Day (2026)
    `${year}-11-11`, // Veterans Day (2026)
    `${year}-11-26`, // Thanksgiving (2026)
    `${year}-12-25`, // Christmas (2026)
  ]
  return new Set(dates)
}

export function isWorkingDay(date: Date, holidays: HolidaySet): boolean {
  if (!date) return false
  const day = date.getUTCDay()
  if (day === 0 || day === 6) return false
  return !holidays.has(toIsoDay(date))
}

export function countWorkingDays(
  start: Date,
  end: Date,
  holidays: HolidaySet
): number {
  if (!start || !end) return 0
  const startDay = normalizeUtcDay(start)
  const last = normalizeUtcDay(end)
  if (last.getTime() <= startDay.getTime()) return 0
  let cursor = new Date(startDay.getTime() + MS_PER_DAY)
  let count = 0
  while (cursor.getTime() <= last.getTime()) {
    if (isWorkingDay(cursor, holidays)) count += 1
    cursor = new Date(cursor.getTime() + MS_PER_DAY)
  }
  return Math.max(0, count)
}
