import { differenceInBusinessDays, startOfDay } from 'date-fns'

export function countWorkingDays(start: Date, end: Date): number {
  if (!start || !end) return 0
  const startDay = startOfDay(start)
  const endDay = startOfDay(end)
  if (endDay < startDay) return 0
  return Math.max(0, differenceInBusinessDays(endDay, startDay))
}
