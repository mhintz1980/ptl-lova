/**
 * KPI Calculators - Pure functions to compute dashboard KPIs from pump data.
 */

import type { Pump } from '../../types'
import type { KpiId } from './dashboardConfig'

export interface KpiValue {
  value: number
  formatted: string
  subtitle?: string
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
    formatted: formatCurrency(total),
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
    formatted: formatCurrency(avg),
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
function calculateThroughput(pumps: Pump[]): KpiValue {
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
  }
}

// Helper to format currency
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}
