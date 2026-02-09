/**
 * @file chat.ts
 * @description Vercel AI SDK chat endpoint with OpenAI provider and pump management tools
 */

import { streamText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { z } from 'zod'
import { getSupabaseAdmin } from './lib/supabase-admin'
import {
  GetPumpsInputSchema,
  GetJobStatusInputSchema,
  GetShopCapacityInputSchema,
  PumpSchema,
  ShopCapacitySummarySchema,
  STAGES,
} from './tools/schemas'

/**
 * Supabase pump row type (snake_case from DB)
 */
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
  ispaused: boolean | null
  pausedat: string | null
  pausedstage: string | null
  totalpauseddays: number | null
  promisedate: string | null
  datereceived: string | null
  powdercoatvendorid: string | null
  work_hours: string | null
}

/**
 * Get pumps with optional filters
 */
export async function getPumpsInternal(
  input: z.infer<typeof GetPumpsInputSchema>
) {
  const { stage, customer, priority, limit = 20 } = input

  const client = getSupabaseAdmin()
  if (!client) {
    return { pumps: [], error: 'Database not configured' }
  }

  try {
    let query = client.from('pump').select('*')

    if (stage) {
      query = query.eq('stage', stage)
    }
    if (customer) {
      query = query.ilike('customer', `%${customer}%`)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    query = query.order('last_update', { ascending: false }).limit(limit)

    const { data, error } = (await query) as {
      data: PumpRow[] | null
      error: Error | null
    }

    if (error) {
      console.error('[getPumps] Database error:', error)
      return { pumps: [], error: error.message }
    }

    // Transform snake_case from DB to camelCase
    const pumps =
      (data || []).map((row) => ({
        id: row.id,
        serial: row.serial,
        po: row.po,
        customer: row.customer,
        model: row.model,
        stage: row.stage,
        priority: row.priority,
        powder_color: row.powder_color,
        last_update: row.last_update,
        value: row.value,
        engine: row.engine,
        gearbox: row.gearbox,
        forecastEnd: row.forecastend,
        forecastStart: row.forecaststart,
        isPaused: row.ispaused,
        pausedAt: row.pausedat,
        pausedStage: row.pausedstage,
        totalPausedDays: row.totalpauseddays,
        promiseDate: row.promisedate,
        dateReceived: row.datereceived,
        powderCoatVendorId: row.powdercoatvendorid,
        work_hours:
          typeof row.work_hours === 'string'
            ? JSON.parse(row.work_hours)
            : row.work_hours,
      })) || []

    const result = PumpSchema.array().safeParse(pumps)
    if (!result.success) {
      console.error('[getPumps] Validation error:', result.error)
      return { pumps: [], error: 'Invalid pump data structure' }
    }

    return { pumps: result.data, error: null }
  } catch (err) {
    console.error('[getPumps] Unexpected error:', err)
    return {
      pumps: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get job status by PO or serial number
 */
export async function getJobStatusInternal(input: {
  po?: string
  serial?: number
}) {
  // Validate that at least one filter is provided
  if (!input.po && !input.serial) {
    return { jobs: [], error: 'Please provide a PO number or serial number' }
  }

  const client = getSupabaseAdmin()
  if (!client) {
    return { jobs: [], error: 'Database not configured' }
  }

  try {
    let query = client.from('pump').select('*')

    if (input.po) {
      query = query.eq('po', input.po)
    }
    if (input.serial) {
      query = query.eq('serial', input.serial)
    }

    const { data, error } = (await query) as {
      data: PumpRow[] | null
      error: Error | null
    }

    if (error) {
      console.error('[getJobStatus] Database error:', error)
      return { jobs: [], error: error.message }
    }

    if (!data || data.length === 0) {
      return { jobs: [], error: null }
    }

    // Transform pump data to job status format
    const jobs = data.map((row) => ({
      id: row.id,
      stage: row.stage,
      completion_percentage: getCompletionPercentage(row.stage),
      current_step: getCurrentStep(row.stage),
      estimated_completion: row.forecastend || null,
      last_updated: row.last_update,
      notes: null,
    }))

    return { jobs, error: null }
  } catch (err) {
    console.error('[getJobStatus] Unexpected error:', err)
    return {
      jobs: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get shop capacity summary by date
 */
export async function getShopCapacityInternal(_input: { date?: string }) {
  const client = getSupabaseAdmin()
  if (!client) {
    return { summary: null, error: 'Database not configured' }
  }

  try {
    // Get all pumps (active ones, excluding CLOSED)
    const { data: pumps, error } = (await client
      .from('pump')
      .select('stage, priority')
      .not('stage', 'eq', 'CLOSED')) as {
      data: { stage: string; priority: string }[] | null
      error: Error | null
    }

    if (error) {
      console.error('[getShopCapacity] Database error:', error)
      return { summary: null, error: error.message }
    }

    // Calculate capacity summary
    const byStage: Record<string, number> = {}
    let totalInProgress = 0

    for (const stage of STAGES) {
      byStage[stage] = 0
    }

    pumps?.forEach((pump) => {
      if (pump.stage !== 'CLOSED') {
        totalInProgress++
        byStage[pump.stage]++
      }
    })

    // Determine bottleneck (stage with most pumps)
    let bottleneck: string | undefined
    let maxCount = 0
    for (const [stage, count] of Object.entries(byStage)) {
      if (count > maxCount) {
        maxCount = count
        bottleneck = stage
      }
    }

    const summary = {
      totalPumpsInProgress: totalInProgress,
      byStage,
      bottleneck: maxCount > 0 ? bottleneck : undefined,
    }

    const result = ShopCapacitySummarySchema.safeParse(summary)
    if (!result.success) {
      console.error('[getShopCapacity] Validation error:', result.error)
      return { summary: null, error: 'Invalid capacity summary structure' }
    }

    return { summary: result.data, error: null }
  } catch (err) {
    console.error('[getShopCapacity] Unexpected error:', err)
    return {
      summary: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Calculate completion percentage based on stage
 */
function getCompletionPercentage(stage: string): number {
  const stageProgress: Record<string, number> = {
    QUEUE: 10,
    FABRICATION: 30,
    STAGED_FOR_POWDER: 45,
    POWDER_COAT: 60,
    ASSEMBLY: 80,
    SHIP: 95,
    CLOSED: 100,
  }
  return stageProgress[stage] || 0
}

/**
 * Get current step description based on stage
 */
function getCurrentStep(stage: string): string {
  const stageSteps: Record<string, string> = {
    QUEUE: 'Awaiting production start',
    FABRICATION: 'In fabrication',
    STAGED_FOR_POWDER: 'Waiting for powder coat',
    POWDER_COAT: 'In powder coat process',
    ASSEMBLY: 'In assembly',
    SHIP: 'Ready for shipping',
    CLOSED: 'Completed and shipped',
  }
  return stageSteps[stage] || 'Unknown stage'
}

// Vercel AI SDK chat endpoint
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful assistant for PumpTracker, a pump manufacturing management system.
You help users query production data about pumps, purchase orders, and shop capacity.

IMPORTANT: When users ask questions, USE THE TOOLS IMMEDIATELY with default values. Do NOT ask for optional parameters.
- All filter parameters (stage, customer, priority) are OPTIONAL
- Default limit is 20 pumps - sufficient for most queries
- If the user doesn't specify filters, call the tool without them

Stages in order: QUEUE → FABRICATION → STAGED_FOR_POWDER → POWDER_COAT → ASSEMBLY → SHIP → CLOSED.

Tool usage:
- getPumps: For any question about pumps, counts, or "how many" - call immediately with the stage filter if mentioned
- getJobStatus: For "where is my order", PO status, or serial number lookups
- getShopCapacity: For capacity, bottlenecks, or workload questions (date is optional)`,
      messages,
      tools: {
        getPumps: tool({
          description:
            'Query pumps with optional filters for stage, customer, priority, and limit',
          inputSchema: GetPumpsInputSchema,
          execute: async (input) => {
            const { pumps, error } = await getPumpsInternal(input)
            if (error) {
              return { pumps: [], error }
            }
            return { pumps, error: null }
          },
        }),
        getJobStatus: tool({
          description:
            'Get job status by purchase order (PO) number or serial number',
          inputSchema: GetJobStatusInputSchema,
          execute: async (input) => {
            const { jobs, error } = await getJobStatusInternal(input)
            if (error) {
              return { jobs: [], error }
            }
            return { jobs, error: null }
          },
        }),
        getShopCapacity: tool({
          description:
            'Get shop capacity summary showing pumps in progress by stage',
          inputSchema: GetShopCapacityInputSchema,
          execute: async (input) => {
            const { summary, error } = await getShopCapacityInternal(input)
            if (error) {
              return { summary: null, error }
            }
            return { summary, error: null }
          },
        }),
      },
      stopWhen: stepCountIs(3), // Allow tool calls and follow-up responses
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[chat] Error:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
