export type HolidaySet = Set<string>

const MS_PER_DAY = 24 * 60 * 60 * 1000

const normalizeUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

export const toIsoDay = (date: Date) =>
  normalizeUtcDay(date).toISOString().split('T')[0]

const addDaysUtc = (date: Date, days: number) =>
  new Date(date.getTime() + days * MS_PER_DAY)

const buildUtcDate = (year: number, month: number, day: number) =>
  normalizeUtcDay(new Date(Date.UTC(year, month, day)))

const observeFixedHoliday = (date: Date) => {
  const day = date.getUTCDay()
  if (day === 6) return addDaysUtc(date, -1)
  if (day === 0) return addDaysUtc(date, 1)
  return date
}

const getNthWeekday = (
  year: number,
  month: number,
  weekday: number,
  occurrence: number
) => {
  const firstOfMonth = buildUtcDate(year, month, 1)
  const firstWeekday = firstOfMonth.getUTCDay()
  const offset = (weekday - firstWeekday + 7) % 7
  const day = 1 + offset + (occurrence - 1) * 7
  return buildUtcDate(year, month, day)
}

const getLastWeekday = (year: number, month: number, weekday: number) => {
  const lastOfMonth = buildUtcDate(year, month + 1, 0)
  const lastWeekday = lastOfMonth.getUTCDay()
  const offset = (lastWeekday - weekday + 7) % 7
  return buildUtcDate(year, month, lastOfMonth.getUTCDate() - offset)
}

export function buildUsFederalHolidays(year: number): HolidaySet {
  const holidays = [
    observeFixedHoliday(buildUtcDate(year - 1, 0, 1)), // Adjacent year New Year
    observeFixedHoliday(buildUtcDate(year, 0, 1)), // New Year's Day
    observeFixedHoliday(buildUtcDate(year + 1, 0, 1)), // Adjacent year New Year
    getNthWeekday(year, 0, 1, 3), // MLK Day (3rd Monday in Jan)
    getNthWeekday(year, 1, 1, 3), // Presidents' Day (3rd Monday in Feb)
    getLastWeekday(year, 4, 1), // Memorial Day (last Monday in May)
    observeFixedHoliday(buildUtcDate(year, 5, 19)), // Juneteenth
    observeFixedHoliday(buildUtcDate(year, 6, 4)), // Independence Day
    getNthWeekday(year, 8, 1, 1), // Labor Day (1st Monday in Sep)
    getNthWeekday(year, 9, 1, 2), // Columbus Day (2nd Monday in Oct)
    observeFixedHoliday(buildUtcDate(year, 10, 11)), // Veterans Day
    getNthWeekday(year, 10, 4, 4), // Thanksgiving (4th Thursday in Nov)
    observeFixedHoliday(buildUtcDate(year, 11, 25)), // Christmas
  ].map((date) => toIsoDay(date))

  return new Set(holidays)
}

export function isWorkingDay(date: Date, holidays: HolidaySet): boolean {
  if (!date) return false
  const normalized = normalizeUtcDay(date)
  const day = normalized.getUTCDay()
  if (day === 0 || day === 6) return false
  return !holidays.has(toIsoDay(normalized))
}

export function countWorkingDays(
  start: Date,
  end: Date,
  holidays: HolidaySet
): number {
  if (!start || !end) return 0
  const startDay = normalizeUtcDay(start)
  const last = normalizeUtcDay(end)
  let count = 0
  if (isWorkingDay(startDay, holidays)) count += 1
  if (last.getTime() <= startDay.getTime()) return Math.max(0, count)
  let cursor = new Date(startDay.getTime() + MS_PER_DAY)
  while (cursor.getTime() <= last.getTime()) {
    if (isWorkingDay(cursor, holidays)) count += 1
    cursor = new Date(cursor.getTime() + MS_PER_DAY)
  }
  return Math.max(0, count)
}
