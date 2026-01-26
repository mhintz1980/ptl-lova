import type { CapacityConfig, Pump, Stage } from '../types'
import { buildUsFederalHolidays, isWorkingDay } from './work-calendar'
import { getModelLeadTimes, getModelWorkHours } from './seed'

export type StageTimelineBlock = {
  stage: Stage
  start: Date
  end: Date
  pausedDays: number
}

type StageRequirement = {
  stage: Stage
  type: 'hours' | 'days'
  remaining: number
}

type PumpState = {
  pump: Pump
  stages: StageRequirement[]
  stageIndex: number
  stageStart: Date
  pausedDays: number
  timeline: StageTimelineBlock[]
}

type ForecastResult = {
  timelines: Record<string, StageTimelineBlock[]>
}

type LeadTimes = {
  fabrication: number
  powder_coat: number
  assembly: number
  ship: number
}

type WorkHours = {
  fabrication: number
  assembly: number
  ship: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const PRODUCTION_STAGES: Stage[] = [
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
]

const normalizeUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addDaysUtc = (date: Date, days: number) =>
  new Date(date.getTime() + days * MS_PER_DAY)

const ensureWorkingDay = (date: Date, holidays: Set<string>) => {
  if (isWorkingDay(date, holidays)) return date
  return nextWorkingDay(date, holidays)
}

const nextWorkingDay = (date: Date, holidays: Set<string>) => {
  let cursor = addDaysUtc(date, 1)
  while (!isWorkingDay(cursor, holidays)) {
    cursor = addDaysUtc(cursor, 1)
  }
  return cursor
}

const priorityRank = (priority?: Pump['priority']) => {
  switch (priority) {
    case 'Urgent':
      return 5
    case 'Rush':
      return 4
    case 'High':
      return 3
    case 'Normal':
      return 2
    case 'Low':
      return 1
    default:
      return 0
  }
}

const getStageMaxWip = (stage: Stage, capacityConfig: CapacityConfig) => {
  switch (stage) {
    case 'FABRICATION':
      return capacityConfig.fabrication.maxWip
    case 'ASSEMBLY':
      return capacityConfig.assembly.maxWip
    case 'SHIP':
      return capacityConfig.ship.maxWip
    default:
      return Number.POSITIVE_INFINITY
  }
}

const buildStageRequirements = (options: {
  stages: Stage[]
  leadTimes: LeadTimes
  workHours: WorkHours
  capacityConfig: CapacityConfig
}) => {
  const { stages, leadTimes, workHours, capacityConfig } = options
  return stages
    .map((stage) => {
      if (stage === 'FABRICATION') {
        return {
          stage,
          type: 'hours' as const,
          remaining: Math.max(0, workHours.fabrication),
        }
      }
      if (stage === 'ASSEMBLY') {
        return {
          stage,
          type: 'hours' as const,
          remaining: Math.max(0, workHours.assembly),
        }
      }
      if (stage === 'SHIP') {
        return {
          stage,
          type: 'hours' as const,
          remaining: Math.max(0, workHours.ship),
        }
      }
      if (stage === 'STAGED_FOR_POWDER') {
        return {
          stage,
          type: 'days' as const,
          remaining: Math.max(
            0,
            Math.ceil(capacityConfig.stagedForPowderBufferDays ?? 0)
          ),
        }
      }
      if (stage === 'POWDER_COAT') {
        return {
          stage,
          type: 'days' as const,
          remaining: Math.max(0, Math.ceil(leadTimes.powder_coat)),
        }
      }
      return null
    })
    .filter((entry): entry is StageRequirement =>
      Boolean(entry && entry.remaining > 0)
    )
}

export function buildCapacityForecast(options: {
  pumps: Pump[]
  capacityConfig: CapacityConfig
  startDate: Date
  leadTimeLookup?: (model: string) => LeadTimes | undefined
  workHoursLookup?: (model: string) => WorkHours | undefined
}): ForecastResult {
  const {
    pumps,
    capacityConfig,
    startDate,
    leadTimeLookup = getModelLeadTimes,
    workHoursLookup = getModelWorkHours,
  } = options

  const holidays = buildUsFederalHolidays(startDate.getFullYear())
  const timelines: Record<string, StageTimelineBlock[]> = {}

  const states: PumpState[] = []

  pumps.forEach((pump) => {
    if (pump.stage === 'CLOSED') return

    const leadTimes = leadTimeLookup(pump.model)
    const workHours = workHoursLookup(pump.model)
    if (!leadTimes || !workHours) return

    const stageStartIndex =
      pump.stage === 'QUEUE'
        ? 0
        : Math.max(0, PRODUCTION_STAGES.indexOf(pump.stage))
    if (stageStartIndex < 0) return

    const stages = PRODUCTION_STAGES.slice(stageStartIndex)
    const requirements = buildStageRequirements({
      stages,
      leadTimes,
      workHours,
      capacityConfig,
    })

    if (requirements.length === 0) return

    const baseStart = pump.forecastStart
      ? new Date(pump.forecastStart)
      : startDate
    const normalizedStart = normalizeUtcDay(
      baseStart.getTime() < startDate.getTime() ? startDate : baseStart
    )
    const stageStart = ensureWorkingDay(normalizedStart, holidays)

    states.push({
      pump,
      stages: requirements,
      stageIndex: 0,
      stageStart,
      pausedDays: 0,
      timeline: [],
    })
  })

  if (states.length === 0) return { timelines }

  let cursor = states.reduce((min, state) =>
    state.stageStart.getTime() < min.getTime() ? state.stageStart : min
  , states[0].stageStart)

  const maxIterations = 365 * 5
  let iterations = 0

  const getSortKey = (pump: Pump) => {
    const dateKey = pump.forecastStart ?? pump.dateReceived
    if (!dateKey) return Number.MAX_SAFE_INTEGER
    const parsed = new Date(dateKey)
    return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime()
  }

  while (states.length > 0 && iterations < maxIterations) {
    iterations += 1

    if (!isWorkingDay(cursor, holidays)) {
      cursor = addDaysUtc(cursor, 1)
      continue
    }

    for (const stage of PRODUCTION_STAGES) {
      const stageStates = states.filter(
        (state) =>
          state.stages[state.stageIndex]?.stage === stage &&
          state.stageStart.getTime() <= cursor.getTime()
      )

      if (stageStates.length === 0) continue

      stageStates.sort((a, b) => {
        const priorityDelta =
          priorityRank(b.pump.priority) - priorityRank(a.pump.priority)
        if (priorityDelta !== 0) return priorityDelta
        return getSortKey(a.pump) - getSortKey(b.pump)
      })

      const maxWip = getStageMaxWip(stage, capacityConfig)
      const activeStates = stageStates.slice(0, maxWip)
      const pausedStates = stageStates.slice(maxWip)

      pausedStates.forEach((state) => {
        state.pausedDays += 1
      })

      const activeCount = activeStates.length
      if (activeCount === 0) continue

      const dailyManHours =
        stage === 'FABRICATION'
          ? capacityConfig.fabrication.dailyManHours
          : stage === 'ASSEMBLY'
            ? capacityConfig.assembly.dailyManHours
            : stage === 'SHIP'
              ? capacityConfig.ship.dailyManHours
              : 0

      const perPumpHours = dailyManHours / activeCount

      activeStates.forEach((state) => {
        const current = state.stages[state.stageIndex]
        if (!current) return

        if (current.type === 'hours') {
          if (perPumpHours <= 0) return
          current.remaining -= perPumpHours
        } else {
          current.remaining -= 1
        }

        if (current.remaining > 0) return

        const end = nextWorkingDay(cursor, holidays)
        state.timeline.push({
          stage: current.stage,
          start: state.stageStart,
          end,
          pausedDays: state.pausedDays,
        })

        state.stageIndex += 1
        state.pausedDays = 0

        while (
          state.stageIndex < state.stages.length &&
          state.stages[state.stageIndex].remaining <= 0
        ) {
          state.stageIndex += 1
        }

        if (state.stageIndex >= state.stages.length) return

        state.stageStart = end
      })
    }

    for (let i = states.length - 1; i >= 0; i -= 1) {
      const state = states[i]
      if (state.stageIndex >= state.stages.length) {
        timelines[state.pump.id] = state.timeline
        states.splice(i, 1)
      }
    }

    cursor = addDaysUtc(cursor, 1)
  }

  states.forEach((state) => {
    timelines[state.pump.id] = state.timeline
  })

  return { timelines }
}
