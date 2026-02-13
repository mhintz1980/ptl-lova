/**
 * @file kpi.ts
 * @description Tool for generating manufacturing KPIs from pump data
 */

import { getSupabaseAdmin } from '../lib/supabase-admin.js'
import { GetKPIReportInputSchema, KPIReportSchema, STAGES } from './schemas.js'
import type { z } from 'zod'

interface PumpRow {
  id: string
  serial: number | null
  po: string
  customer: string
  model: string
  stage: string
  priority: string
  powder_color: string | null
  last_update: string
  value: number
  engine: string | null
  gearbox: string | null
  forecastend: string | null
  forecaststart: string | null
  promisedate: string | null
  datereceived: string | null
  powdercoatvendorid: string | null
  work_hours: string | null
}

export async function getKPIReportInternal(
  input: z.infer<typeof GetKPIReportInputSchema>
) {
  const { metric, dateRange } = input
  const client = getSupabaseAdmin()
  if (!client) {
    return { report: null, error: 'Database not configured' }
  }

  // Default date range: last 30 days
  const end = dateRange?.end ? new Date(dateRange.end) : new Date()
  const start = dateRange?.start ? new Date(dateRange.start) : new Date()
  if (!dateRange?.start) start.setDate(end.getDate() - 30)

  try {
    let value = 0
    let unit = ''
    let insight = ''
    let trend = undefined

    // Determine query based on metric
    let query = client.from('pump').select('*')

    // Filter by date range (roughly)
    // For specific metrics we might filter differently
    query = query
      .gte('last_update', start.toISOString())
      .lte('last_update', end.toISOString())

    const { data, error } = await query

    // Cast to expected type since we don't have global DB types generated yet
    const pumps = (data as unknown as PumpRow[]) || []

    if (error) {
      console.error('[getKPIReport] Database error:', error)
      return { report: null, error: error.message }
    }

    if (!pumps || pumps.length === 0) {
      return {
        report: {
          metric,
          period: { start: start.toISOString(), end: end.toISOString() },
          value: 0,
          unit: 'N/A',
          insight: 'No data found for this period',
        },
        error: null,
      }
    }

    // --- Metric Calculation Logic ---

    // 1. Throughput: Completed pumps
    if (metric === 'throughput') {
      const completed = pumps.filter(
        (p) => p.stage === 'CLOSED' || p.stage === 'SHIP'
      )
      value = completed.length
      unit = 'pumps'
      insight = `${value} pumps reached SHIP/CLOSED in this period.`
    }

    // 2. Cycle Time: Avg time from STAGED_FOR_POWDER (approx start) to SHIP
    // Note: We don't have perfect history tracking in 'pump' table, only current state + timestamps
    // We will approximate using `datereceived` -> `last_update` for completed pumps
    else if (metric === 'cycleTime') {
      const completed = pumps.filter(
        (p) => (p.stage === 'CLOSED' || p.stage === 'SHIP') && p.datereceived
      )
      if (completed.length > 0) {
        const totalDays = completed.reduce((sum, p) => {
          const received = new Date(p.datereceived!)
          const finished = new Date(p.last_update)
          return (
            sum +
            (finished.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
          )
        }, 0)
        value = Math.round(totalDays / completed.length)
        unit = 'days'
        insight = `Average ${value} days from received to ship.`
      } else {
        unit = 'days'
        insight = 'No completed pumps with valid dates found.'
      }
    }

    // 3. On-Time Delivery: % shipped before promise date
    else if (metric === 'onTimeDelivery') {
      const shipped = pumps.filter(
        (p) => (p.stage === 'CLOSED' || p.stage === 'SHIP') && p.promisedate
      )
      if (shipped.length > 0) {
        const onTime = shipped.filter((p) => {
          const finished = new Date(p.last_update)
          const promised = new Date(p.promisedate!)
          return finished <= promised
        })
        value = Math.round((onTime.length / shipped.length) * 100)
        unit = '%'
        insight = `${onTime.length} of ${shipped.length} pumps shipped on or before promise date.`
      } else {
        unit = '%'
        insight = 'No shipped pumps with promise dates found.'
      }
    }

    // 4. WIP Aging: Average age of active pumps
    else if (metric === 'wipAging') {
      const active = pumps.filter(
        (p) => p.stage !== 'CLOSED' && p.stage !== 'SHIP' && p.datereceived
      )
      if (active.length > 0) {
        const now = new Date()
        const totalAge = active.reduce((sum, p) => {
          const received = new Date(p.datereceived!)
          return (
            sum + (now.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
          )
        }, 0)
        value = Math.round(totalAge / active.length)
        unit = 'days'
        insight = `Active pumps have been in process for ${value} days on average.`
      } else {
        unit = 'days'
        insight = 'No active pumps with receive dates found.'
      }
    }

    const report = {
      metric,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      value,
      unit,
      insight,
      trend, // trend requires comparison with previous period, skipping for simplicity in V1
    }

    return { report, error: null }
  } catch (err) {
    console.error('[getKPIReport] Unexpected error:', err)
    return {
      report: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
