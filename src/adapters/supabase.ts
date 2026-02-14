// src/adapters/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Pump, DataAdapter } from '../types'
import { logErrorReport } from '../lib/error-reporting'

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ TEST ENVIRONMENT GUARD: Prevent tests from using SupabaseAdapter
// ═══════════════════════════════════════════════════════════════════════════
// This is the FINAL safety layer. Even if vitest.setup.ts and vite.config.ts
// fail to clear env vars, this will throw and prevent production writes.
// ═══════════════════════════════════════════════════════════════════════════
const isTestEnvironment =
  typeof process !== 'undefined' &&
  (process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'test' ||
    // @ts-expect-error - vitest global
    typeof globalThis.__vitest_worker__ !== 'undefined')

// NOTE: This client is configured to use environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// which must be set in a .env file for this adapter to work.

const url = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

// CRITICAL: Block Supabase initialization in test environment
if (isTestEnvironment && (url || key)) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  🚨  DANGER: SUPABASE CREDENTIALS DETECTED IN TEST ENVIRONMENT  🚨          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  This should NEVER happen. Tests must use LocalAdapter or SandboxAdapter.   ║
║  Check vite.config.ts test.env and vitest.setup.ts are configured properly. ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)
  throw new Error(
    'SupabaseAdapter cannot be initialized in test environment. ' +
      'This is a critical safety violation that could write to production.'
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE ADAPTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Prevent crash if keys are missing (Local Mode)
export const supabase = url && key ? createClient(url, key) : null

if (!supabase) {
  console.warn('[Supabase] Client NOT initialized - missing URL or API key')
}

// Factory function for dependency injection (testing)
export const createSupabaseAdapter = (client: any): DataAdapter => ({
  async load(): Promise<Pump[]> {
    if (!client) {
      console.warn(
        '[Supabase] load() - No client available, returning empty array'
      )
      return []
    }

    let attempts = 0
    const maxAttempts = 3
    const backoffIntervals = [500, 1000, 1500]

    while (attempts < maxAttempts) {
      const { data, error } = await client.from('pump').select('*')

      if (!error) {
        // Supabase returns snake_case, we assume the data is normalized to camelCase by the time it hits the store
        // For Lite, we cast and assume the DB schema matches the Pump interface (which it should, as per spec)
        return data as Pump[]
      }

      attempts++
      // Log error without exposing sensitive data
      logErrorReport(error, {
        where: 'SupabaseAdapter.load',
        what: 'Failed to load pumps from Supabase',
        request: {
          route: 'StoreInit',
          operation: 'select pump rows',
          inputSummary: `attempt=${attempts} maxAttempts=${maxAttempts}`,
        },
      })

      const delayIndex = Math.min(attempts - 1, backoffIntervals.length - 1)
      const delay = backoffIntervals[delayIndex]
      console.warn(`[Supabase] Retrying in ${delay}ms...`)

      if (attempts >= maxAttempts) {
        logErrorReport(error, {
          where: 'SupabaseAdapter.load',
          what: 'Supabase load exhausted retries',
          request: {
            route: 'StoreInit',
            operation: 'select pump rows',
            inputSummary: `attempts=${attempts}`,
          },
        })
        throw error
      }

      await new Promise((res) => setTimeout(res, delay))
    }

    // This part should not be reachable, throw to ensure we never silently fail
    console.error('[Supabase] load() - Exhausted retries without success')
    throw new Error('Failed to load data after maximum retries')
  },
  /**
   * @deprecated DANGEROUS: This function deletes ALL data before inserting.
   * Use syncAll() instead which uses safe UPSERT-only approach.
   * This function is now disabled to prevent accidental data wipe.
   */
  async replaceAll(rows: Pump[]) {
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚨 DANGER: This function previously caused production data loss!
    // It deleted ALL rows before inserting new ones.
    // Now disabled - use syncAll() for safe upsert operations.
    // ═══════════════════════════════════════════════════════════════════════════
    const error = new Error(
      'replaceAll() is DISABLED to prevent data loss. Use syncAll() or upsertMany() instead. ' +
        'This function previously deleted all production data. See: fix/prevent-data-wipe branch.'
    )
    logErrorReport(error, {
      where: 'SupabaseAdapter.replaceAll',
      what: 'Attempted to use dangerous replaceAll() which is now disabled',
      request: {
        route: 'DataSync',
        operation: 'BLOCKED: replaceAll attempted',
        inputSummary: `rows=${rows.length} - OPERATION BLOCKED FOR SAFETY`,
      },
    })
    console.error(
      '[Supabase] replaceAll() is DISABLED to prevent data loss! Use syncAll() or upsertMany() instead.'
    )
    throw error
  },

  /**
   * Safe replacement for replaceAll(). Uses UPSERT-only approach.
   * Does NOT delete any existing data - only inserts or updates provided rows.
   */
  async syncAll(rows: Pump[]) {
    if (!client) {
      const error = new Error(
        'Supabase client not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      )
      logErrorReport(error, {
        where: 'SupabaseAdapter.syncAll',
        what: 'Supabase client not configured - cannot persist data',
        request: {
          route: 'DataSync',
          operation: 'replace all pump rows',
          inputSummary: `rows=${rows.length}`,
        },
      })
      throw error
    }

    if (rows.length === 0) return

    // Safe UPSERT-only approach: inserts new rows, updates existing ones
    // Does NOT delete any data - much safer than replaceAll
    const { error: upsertError } = await client.from('pump').upsert(rows)
    if (upsertError) {
      logErrorReport(upsertError, {
        where: 'SupabaseAdapter.syncAll',
        what: 'Failed to upsert pump rows during sync',
        request: {
          route: 'DataSync',
          operation: 'upsert pump rows',
          inputSummary: `rows=${rows.length}`,
        },
      })
      throw upsertError
    }
  },
  async upsertMany(rows: Pump[]) {
    if (!client) {
      const error = new Error(
        'Supabase client not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      )
      logErrorReport(error, {
        where: 'SupabaseAdapter.upsertMany',
        what: 'Supabase client not configured - cannot persist data',
        request: {
          route: 'AddPoModal',
          operation: 'upsert pump rows',
          inputSummary: `rows=${rows.length}`,
        },
      })
      throw error
    }

    if (rows.length) {
      const { error } = await client.from('pump').upsert(rows)
      if (error) {
        logErrorReport(error, {
          where: 'SupabaseAdapter.upsertMany',
          what: 'Failed to upsert pump rows',
          request: {
            route: 'AddPoModal',
            operation: 'upsert pump rows',
            inputSummary: `rows=${rows.length}`,
          },
        })
        throw error
      }
    }
  },
  async update(id: string, patch: Partial<Pump>) {
    if (!client) {
      const error = new Error(
        'Supabase client not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      )
      logErrorReport(error, {
        where: 'SupabaseAdapter.update',
        what: 'Supabase client not configured - cannot persist data',
        request: {
          route: 'PumpDetail',
          operation: 'update pump row',
          inputSummary: `id=${id?.substring(0, 8) ?? 'unknown'} patchKeys=${Object.keys(patch).length}`,
        },
      })
      throw error
    }

    const { error } = await client.from('pump').update(patch).eq('id', id)
    if (error) {
      logErrorReport(error, {
        where: 'SupabaseAdapter.update',
        what: 'Failed to update pump row',
        request: {
          route: 'PumpDetail',
          operation: 'update pump row',
          inputSummary: `id=${id?.substring(0, 8) ?? 'unknown'} patchKeys=${Object.keys(patch).length}`,
        },
      })
      throw error
    }
  },
})

export const SupabaseAdapter: DataAdapter = createSupabaseAdapter(supabase)
