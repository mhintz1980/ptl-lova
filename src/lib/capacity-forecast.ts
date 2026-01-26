import type { CapacityConfig, Pump, Stage } from '../types'

export type StageTimelineBlock = {
  stage: Stage
  start: Date
  end: Date
  pausedDays: number
}

type ForecastResult = {
  timelines: Record<string, StageTimelineBlock[]>
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const priorityRank = (priority?: Pump['priority']) => {
  switch (priority) {
    case 'HIGH':
      return 3
    case 'MEDIUM':
      return 2
    case 'LOW':
      return 1
    default:
      return 0
  }
}

export function buildCapacityForecast(options: {
  pumps: Pump[]
  capacityConfig: CapacityConfig
  startDate: Date
}): ForecastResult {
  const { pumps, capacityConfig, startDate } = options
  const timelines: Record<string, StageTimelineBlock[]> = {}

  const grouped = new Map<Stage, Pump[]>()
  pumps.forEach((pump) => {
    const list = grouped.get(pump.stage) ?? []
    list.push(pump)
    grouped.set(pump.stage, list)
  })

  grouped.forEach((stagePumps, stage) => {
    const sorted = [...stagePumps].sort(
      (a, b) => priorityRank(b.priority) - priorityRank(a.priority)
    )

    const maxWip =
      stage === 'FABRICATION'
        ? capacityConfig.fabrication.maxWip
        : stage === 'ASSEMBLY'
          ? capacityConfig.assembly.maxWip
          : stage === 'SHIP'
            ? capacityConfig.ship.maxWip
            : Number.POSITIVE_INFINITY

    sorted.forEach((pump, index) => {
      const pausedDays = index >= maxWip ? 1 : 0
      const end = new Date(startDate.getTime() + (1 + pausedDays) * MS_PER_DAY)
      timelines[pump.id] = [
        {
          stage,
          start: startDate,
          end,
          pausedDays,
        },
      ]
    })
  })

  return { timelines }
}
