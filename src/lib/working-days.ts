import { buildUsFederalHolidays, countWorkingDays as countDays } from './work-calendar'

export function countWorkingDays(start: Date, end: Date): number {
  if (!start || !end) return 0
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const holidays = new Set<string>()
  for (let year = startYear; year <= endYear; year += 1) {
    for (const holiday of buildUsFederalHolidays(year)) {
      holidays.add(holiday)
    }
  }
  return countDays(start, end, holidays)
}
