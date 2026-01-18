/**
 * KPI Calculators - Pure functions to compute dashboard KPIs from pump data.
 */

import type { Pump } from '../../types'
import type { KpiId } from './dashboardConfig'
import { formatCompactCurrency } from '../../lib/format'

export interface KpiValue {
  value: number
  formatted: string
  subtitle?: string
  health?: 'positive' | 'neutral' | 'negative'
}

/**
 * Calculate all KPIs for given pump data
 */
export function calculateKpi(id: KpiId, pumps: Pump[]): KpiValue {
  switch (id) {
    case 'activeWip':
      return calculateActiveWip(pumps)
    case 'lateOrders':
      return calculateLateOrders(pumps)
    case 'capacityUtil':
      return calculateCapacityUtil(pumps)
    case 'totalValue':
      return calculateTotalValue(pumps)
    case 'avgOrderValue':
      return calculateAvgOrderValue(pumps)
    case 'topCustomer':
      return calculateTopCustomer(pumps)
    case 'avgLeadTime':
      return calculateAvgLeadTime(pumps)
    case 'throughput':
      return calculateThroughput(pumps)
    case 'onTimeRate':
      return calculateOnTimeRate(pumps)
    default:
      return { value: 0, formatted: '—' }
  }
}

// Active WIP: Pumps not in QUEUE or CLOSED
function calculateActiveWip(pumps: Pump[]): KpiValue {
  const active = pumps.filter(
    (p) => p.stage !== 'QUEUE' && p.stage !== 'CLOSED'
  )
  return {
    value: active.length,
    formatted: `${active.length}`,
    subtitle: 'pumps in production',
    health: 'neutral',
  }
}

// Late Orders: Past promise date, not closed
function calculateLateOrders(pumps: Pump[]): KpiValue {
  const now = new Date()
  const late = pumps.filter(
    (p) =>
      p.promiseDate && new Date(p.promiseDate) < now && p.stage !== 'CLOSED'
  )
  return {
    value: late.length,
    formatted: `${late.length}`,
    subtitle:
      late.length === 1 ? 'order behind schedule' : 'orders behind schedule',
    health: late.length > 0 ? 'negative' : 'positive',
  }
}

// Capacity Utilization: Active pumps / total non-closed
function calculateCapacityUtil(pumps: Pump[]): KpiValue {
  const nonClosed = pumps.filter((p) => p.stage !== 'CLOSED')
  const active = nonClosed.filter((p) => p.stage !== 'QUEUE')
  const util =
    nonClosed.length > 0 ? (active.length / nonClosed.length) * 100 : 0
  return {
    value: util,
    formatted: `${Math.round(util)}%`,
    subtitle: `${active.length} of ${nonClosed.length} pumps active`,
  }
}

// Total Value: Sum of all non-closed pump values
function calculateTotalValue(pumps: Pump[]): KpiValue {
  const nonClosed = pumps.filter((p) => p.stage !== 'CLOSED')
  const total = nonClosed.reduce((sum, p) => sum + (p.value || 0), 0)
  return {
    value: total,
    formatted: formatCompactCurrency(total),
    subtitle: `across ${nonClosed.length} orders`,
  }
}

// Average Order Value
function calculateAvgOrderValue(pumps: Pump[]): KpiValue {
  const withValue = pumps.filter((p) => p.value && p.value > 0)
  const avg =
    withValue.length > 0
      ? withValue.reduce((sum, p) => sum + (p.value || 0), 0) / withValue.length
      : 0
  return {
    value: avg,
    formatted: formatCompactCurrency(avg),
    subtitle: 'per pump',
  }
}

// Top Customer: Customer with most pumps
function calculateTopCustomer(pumps: Pump[]): KpiValue {
  const counts: Record<string, number> = {}
  pumps.forEach((p) => {
    if (p.customer) {
      counts[p.customer] = (counts[p.customer] || 0) + 1
    }
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  return {
    value: top ? top[1] : 0,
    formatted: top ? top[0] : '—',
    subtitle: top ? `${top[1]} pumps` : undefined,
  }
}

// Average Lead Time: Days from QUEUE to CLOSED
function calculateAvgLeadTime(pumps: Pump[]): KpiValue {
  const closed = pumps.filter((p) => p.stage === 'CLOSED' && p.forecastEnd)
  if (closed.length === 0) {
    return { value: 0, formatted: '—', subtitle: 'no data yet' }
  }
  // Use difference between last_update and forecastStart as proxy
  const totalDays = closed.reduce((sum, p) => {
    if (p.forecastStart && p.last_update) {
      const start = new Date(p.forecastStart)
      const end = new Date(p.last_update)
      return (
        sum + Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
    return sum
  }, 0)
  const avg = totalDays / closed.length
  return {
    value: avg,
    formatted: `${avg.toFixed(1)} days`,
    subtitle: `avg across ${closed.length} completed`,
  }
}

// Throughput: Closed pumps in last 30 days
export function calculateThroughput(pumps: Pump[]): KpiValue {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = pumps.filter(
    (p) =>
      p.stage === 'CLOSED' &&
      p.last_update &&
      new Date(p.last_update) >= thirtyDaysAgo
  )
  return {
    value: recent.length,
    formatted: `${recent.length}`,
    subtitle: 'completed this month',
  }
}

// On-Time Rate: % of closed pumps completed by promise date
function calculateOnTimeRate(pumps: Pump[]): KpiValue {
  const closed = pumps.filter(
    (p) => p.stage === 'CLOSED' && p.promiseDate && p.last_update
  )
  if (closed.length === 0) {
    return { value: 0, formatted: '—', subtitle: 'no data yet' }
  }
  const onTime = closed.filter(
    (p) => new Date(p.last_update!) <= new Date(p.promiseDate!)
  )
  const rate = (onTime.length / closed.length) * 100
  return {
    value: rate,
    formatted: `${Math.round(rate)}%`,
    subtitle: `${onTime.length} of ${closed.length} on time`,
    health: rate >= 95 ? 'positive' : rate >= 90 ? 'neutral' : 'negative',
  }
}

// ---- Chart Data Helpers ----

export function getWorkloadByStage(
  pumps: Pump[]
): { name: string; value: number; id: string }[] {
  const counts: Record<string, number> = {}
  pumps.forEach((p) => {
    if (p.stage === 'CLOSED') return
    counts[p.stage] = (counts[p.stage] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    id: name,
  }))
}

export function getPumpsByCustomer(
  pumps: Pump[]
): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
  pumps.forEach((p) => {
    if (p.stage === 'CLOSED') return
    if (p.customer) counts[p.customer] = (counts[p.customer] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))
}

export function getCapacityByDept(
  pumps: Pump[]
): { name: string; value: number; limit: number }[] {
  const counts = {
    Fabrication: 0,
    'Powder Coat': 0,
    Assembly: 0,
    'Testing & Shipping': 0,
  }

  pumps.forEach((p) => {
    if (p.stage === 'FABRICATION') counts['Fabrication']++
    if (p.stage === 'STAGED_FOR_POWDER' || p.stage === 'POWDER_COAT')
      counts['Powder Coat']++
    if (p.stage === 'ASSEMBLY') counts['Assembly']++
    if (p.stage === 'SHIP') counts['Testing & Shipping']++
  })

  // Mock limits for now
  const limits = {
    Fabrication: 20,
    'Powder Coat': 25,
    Assembly: 15,
    'Testing & Shipping': 10,
  }

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    limit: limits[name as keyof typeof limits],
  }))
}

export function getWeeklyThroughput(pumps: Pump[]): number {
  return calculateThroughput(pumps).value
}

export function getAverageStageAge(
  pumps: Pump[]
): { stage: string; age: number }[] {
  const active = pumps.filter(
    (p) => p.stage !== 'CLOSED' && p.stage !== 'QUEUE'
  )
  const totals: Record<string, { days: number; count: number }> = {}

  active.forEach((p) => {
    if (!p.last_update) return
    const days =
      Math.abs(new Date().getTime() - new Date(p.last_update).getTime()) /
      (1000 * 60 * 60 * 24)

    if (!totals[p.stage]) totals[p.stage] = { days: 0, count: 0 }
    totals[p.stage].days += days
    totals[p.stage].count += 1
  })

  // Canonical order
  const stages = [
    'FABRICATION',
    'STAGED_FOR_POWDER',
    'POWDER_COAT',
    'ASSEMBLY',
    'SHIP',
  ]

  return stages.map((stage) => {
    const data = totals[stage] || { days: 0, count: 0 }
    return {
      stage,
      age: data.count > 0 ? data.days / data.count : 0,
    }
  })
}
