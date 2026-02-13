/**
 * @file customer.ts
 * @description Tool for retrieving customer information via aggregation
 */

import { getSupabaseAdmin } from '../lib/supabase-admin.js'
import {
  GetCustomerInfoInputSchema,
  CustomerInfoSchema,
  STAGES,
  PurchaseOrderSchema,
} from './schemas.js'
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

export async function getCustomerInfoInternal(
  input: z.infer<typeof GetCustomerInfoInputSchema>
) {
  const { customerName, includeRecentOrders } = input

  const client = getSupabaseAdmin()
  if (!client) {
    return { customerInfo: null, error: 'Database not configured' }
  }

  try {
    // 1. Get all pumps for this customer
    // We fetch a bit more data to perform aggregations in memory
    // Since we don't have a customers table, we search by ILIKE on the pump table
    let query = client
      .from('pump')
      .select('*')
      .ilike('customer', `%${customerName}%`)
      .order('last_update', { ascending: false })
      .limit(500) // Safety limit for aggregation

    const { data, error } = await query

    // Cast to expected type since we don't have global DB types generated yet
    const pumps = (data as unknown as PumpRow[]) || []

    if (error) {
      console.error('[getCustomerInfo] Database error:', error)
      return { customerInfo: null, error: error.message }
    }

    if (!pumps || pumps.length === 0) {
      return {
        customerInfo: null,
        error: `No customer found matching "${customerName}"`,
      }
    }

    // 2. Perform aggregations
    // We'll use the canonical name from the most recent order to normalize case
    const canonicalName = pumps[0].customer

    const activePumps = pumps.filter((p) => p.stage !== 'CLOSED')
    const completedPumps = pumps.filter((p) => p.stage === 'CLOSED')

    // Calculate total value of active + completed (historical)
    // Note: 'value' in DB is per-pump value
    const totalValue = pumps.reduce((sum, p) => sum + (Number(p.value) || 0), 0)

    // Stage breakdown
    const activeOrdersByStage: Record<string, number> = {}
    STAGES.forEach((stage) => {
      activeOrdersByStage[stage] = 0
    })

    activePumps.forEach((p) => {
      if (activeOrdersByStage[p.stage] !== undefined) {
        activeOrdersByStage[p.stage]++
      }
    })

    // 3. Construct recent orders (POs) if requested
    let recentOrders = undefined
    if (includeRecentOrders) {
      // Group pumps by PO
      const poMap = new Map<string, any[]>()
      pumps.forEach((p) => {
        if (!poMap.has(p.po)) {
          poMap.set(p.po, [])
        }
        poMap.get(p.po)?.push(p)
      })

      // Convert map to PurchaseOrder objects (simplified)
      // We only take the top 5 most recent POs
      const poKeys = Array.from(poMap.keys()).slice(0, 5)

      recentOrders = poKeys.map((poNum) => {
        const poPumps = poMap.get(poNum) || []
        const first = poPumps[0]

        // Determine aggregated status
        const isAllClosed = poPumps.every((p) => p.stage === 'CLOSED')
        const isSomeClosed = poPumps.some((p) => p.stage === 'CLOSED')
        let status = 'pending'
        if (isAllClosed) status = 'completed'
        else if (isSomeClosed || poPumps.some((p) => p.stage !== 'QUEUE'))
          status = 'in_progress'

        return {
          po: poNum,
          customer: first.customer,
          dateReceived: first.datereceived, // Using first pump's date
          promiseDate: first.promisedate,
          status: status as any,
          lines: poPumps.map((p) => ({
            model: p.model,
            quantity: 1, // Each pump row is 1 unit
            valueEach: p.value,
            notes: `Serial: ${p.serial || 'N/A'}, Stage: ${p.stage}`,
          })),
        }
      })
    }

    const result = {
      customerName: canonicalName,
      totalActiveOrders: activePumps.length,
      totalCompletedOrders: completedPumps.length,
      totalValue,
      lastOrderDate: pumps[0].last_update, // Using last_update as proxy for recent activity
      activeOrdersByStage,
      recentOrders,
    }

    // Validate against schema
    const parsed = CustomerInfoSchema.safeParse(result)
    if (!parsed.success) {
      console.error('[getCustomerInfo] Validation error:', parsed.error)
      return {
        customerInfo: null,
        error: 'Failed to construct valid customer info',
      }
    }

    return { customerInfo: parsed.data, error: null }
  } catch (err) {
    console.error('[getCustomerInfo] Unexpected error:', err)
    return {
      customerInfo: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
