// src/lib/riskCalculator.ts
// Risk calculation for schedule page visual indicators

import type { Pump } from '../types'

/**
 * Risk status for a pump/job
 * - 'on-track': Job is progressing well, expected to meet promise date
 * - 'at-risk': Job may miss promise date (within warning threshold)
 * - 'late': Job has already missed promise date or is significantly behind
 */
export type RiskStatus = 'on-track' | 'at-risk' | 'late'

/**
 * Risk calculation result with details
 */
export interface RiskResult {
  status: RiskStatus
  daysUntilPromise: number | null // Negative = overdue
  daysBehindSchedule: number // Difference between ideal and actual progress
  reasons: string[] // Human-readable risk factors
}

// Thresholds in days
const AT_RISK_THRESHOLD_DAYS = 3 // Within 3 days of promise = at-risk
const LATE_THRESHOLD_DAYS = 0 // Past promise date = late

/**
 * Calculate risk status for a pump based on:
 * 1. Days remaining until promise date
 * 2. Days behind ideal schedule (forecastEnd vs promiseDate)
 *
 * @param pump - The pump to evaluate
 * @param forecastEndDate - Optional projected completion date (from projection-engine)
 * @param today - Optional current date for testing
 */
export function calculateRisk(
  pump: Pump,
  forecastEndDate?: Date,
  today: Date = new Date()
): RiskResult {
  const reasons: string[] = []
  let status: RiskStatus = 'on-track'
  let daysUntilPromise: number | null = null
  let daysBehindSchedule = 0

  // 1. Calculate days until promise date
  if (pump.promiseDate) {
    const promiseDate = new Date(pump.promiseDate)
    const msPerDay = 24 * 60 * 60 * 1000
    daysUntilPromise = Math.ceil(
      (promiseDate.getTime() - today.getTime()) / msPerDay
    )

    if (daysUntilPromise < LATE_THRESHOLD_DAYS) {
      status = 'late'
      reasons.push(`Overdue by ${Math.abs(daysUntilPromise)} day(s)`)
    } else if (daysUntilPromise <= AT_RISK_THRESHOLD_DAYS) {
      status = 'at-risk'
      reasons.push(`Due in ${daysUntilPromise} day(s)`)
    }
  }

  // 2. Calculate days behind schedule (forecastEnd vs promiseDate)
  if (pump.promiseDate && forecastEndDate) {
    const promiseDate = new Date(pump.promiseDate)
    const msPerDay = 24 * 60 * 60 * 1000
    daysBehindSchedule = Math.ceil(
      (forecastEndDate.getTime() - promiseDate.getTime()) / msPerDay
    )

    if (daysBehindSchedule > 3) {
      // Significantly behind = late (overrides any previous status)
      status = 'late'
      reasons.push(`Forecast ${daysBehindSchedule} day(s) behind promise`)
    } else if (daysBehindSchedule > 0 && status !== 'late') {
      // Slightly behind = at-risk (but don't downgrade from late)
      status = 'at-risk'
      reasons.push(`Forecast ${daysBehindSchedule} day(s) behind promise`)
    }
  }

  // 3. Consider priority escalation
  if (pump.priority === 'Urgent' || pump.priority === 'Rush') {
    if (status === 'at-risk') {
      // High priority + at-risk = more urgent
      reasons.push(`${pump.priority} priority requires attention`)
    }
  }

  return {
    status,
    daysUntilPromise,
    daysBehindSchedule,
    reasons,
  }
}

/**
 * Get CSS classes for risk status styling
 */
export function getRiskClasses(status: RiskStatus): string {
  switch (status) {
    case 'late':
      return 'ring-2 ring-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
    case 'at-risk':
      return 'ring-1 ring-amber-500/50'
    default:
      return ''
  }
}

/**
 * Get border color for risk status
 */
export function getRiskBorderColor(status: RiskStatus): string {
  switch (status) {
    case 'late':
      return '#F43F5E' // Rose-500
    case 'at-risk':
      return '#F59E0B' // Amber-500
    default:
      return 'transparent'
  }
}
