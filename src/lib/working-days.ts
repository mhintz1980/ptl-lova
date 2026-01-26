import { buildUsFederalHolidays, countWorkingDays as countDays } from './work-calendar'

export function countWorkingDays(start: Date, end: Date): number {
  if (!start || !end) return 0
  const holidays = buildUsFederalHolidays(start.getFullYear())
  return countDays(start, end, holidays)
}
