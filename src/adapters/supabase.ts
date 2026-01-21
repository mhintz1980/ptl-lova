// src/adapters/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Pump, DataAdapter } from '../types'
import { logErrorReport } from '../lib/error-reporting'

// NOTE: This client is configured to use environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// which must be set in a .env file for this adapter to work.

const url = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE ADAPTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
console.log('🔵 [Supabase] Module loaded at:', new Date().toISOString())
console.log('🔵 [Supabase] Configuration:', {
  hasUrl: !!url,
  urlPrefix: url ? url.substring(0, 30) + '...' : 'NOT SET',
  hasKey: !!key,
  keyPrefix: key ? key.substring(0, 10) + '...' : 'NOT SET',
})

// Prevent crash if keys are missing (Local Mode)
export const supabase = url && key ? createClient(url, key) : null

if (supabase) {
  console.log('✅ [Supabase] Client initialized successfully')
} else {
  console.warn('⚠️ [Supabase] Client NOT initialized - missing URL or API key')
}

export const SupabaseAdapter: DataAdapter = {
  async load(): Promise<Pump[]> {
    console.log('🔵 [Supabase] load() called at:', new Date().toISOString())

    if (!supabase) {
      console.warn(
        '⚠️ [Supabase] load() - No client available, returning empty array'
      )
      return []
    }

    let attempts = 0
    const maxAttempts = 3
    const backoffIntervals = [500, 1000, 1500]

    while (attempts < maxAttempts) {
      console.log(
        '🔵 [Supabase] load() - Fetching from pump table (attempt',
        attempts + 1,
        'of',
        maxAttempts,
        ')'
      )
      const { data, error } = await supabase.from('pump').select('*')

      if (!error) {
        console.log(
          '✅ [Supabase] load() SUCCESS - Retrieved',
          data?.length ?? 0,
          'rows from database'
        )
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
      // Retry attempt logging
      console.warn(`⚠️ [Supabase] Retrying in ${delay}ms...`)

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
    console.error('❌ [Supabase] load() - Exhausted retries without success')
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
      '🚨 [Supabase] replaceAll() is DISABLED to prevent data loss!'
    )
    console.error('🚨 Use syncAll() or upsertMany() instead.')
    throw error
  },

  /**
   * Safe replacement for replaceAll(). Uses UPSERT-only approach.
   * Does NOT delete any existing data - only inserts or updates provided rows.
   */
  async syncAll(rows: Pump[]) {
    console.log(
      '🔵 [Supabase] syncAll() called with',
      rows.length,
      'rows at:',
      new Date().toISOString()
    )

    if (!supabase) {
      console.warn(
        '⚠️ [Supabase] syncAll() - No client available, operation skipped'
      )
      return
    }

    if (rows.length === 0) {
      console.log('🔵 [Supabase] syncAll() - No rows provided, nothing to sync')
      return
    }

    // Safe UPSERT-only approach: inserts new rows, updates existing ones
    // Does NOT delete any data - much safer than replaceAll
    console.log(
      '🔵 [Supabase] syncAll() - Upserting',
      rows.length,
      'rows (safe mode - no deletions)...'
    )
    const { error: upsertError } = await supabase.from('pump').upsert(rows)
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
    console.log(
      '✅ [Supabase] syncAll() SUCCESS - Synced',
      rows.length,
      'rows (no deletions)'
    )
  },
  async upsertMany(rows: Pump[]) {
    console.log(
      '🔵 [Supabase] upsertMany() called with',
      rows.length,
      'rows at:',
      new Date().toISOString()
    )

    if (!supabase) {
      console.warn(
        '⚠️ [Supabase] upsertMany() - No client available, operation skipped'
      )
      return
    }

    if (rows.length) {
      console.log(
        '🔵 [Supabase] upsertMany() - Upserting rows:',
        rows.map((r) => ({ id: r.id?.substring(0, 8), model: r.model }))
      )
      const { error } = await supabase.from('pump').upsert(rows)
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
      console.log(
        '✅ [Supabase] upsertMany() SUCCESS - Upserted',
        rows.length,
        'rows'
      )
    } else {
      console.log(
        '🔵 [Supabase] upsertMany() - No rows provided, nothing to upsert'
      )
    }
  },
  async update(id: string, patch: Partial<Pump>) {
    console.log(
      '🔵 [Supabase] update() called for id:',
      id?.substring(0, 8) + '...',
      'at:',
      new Date().toISOString()
    )
    console.log('🔵 [Supabase] update() patch keys:', Object.keys(patch))

    if (!supabase) {
      console.warn(
        '⚠️ [Supabase] update() - No client available, operation skipped'
      )
      return
    }

    const { error } = await supabase.from('pump').update(patch).eq('id', id)
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
    console.log(
      '✅ [Supabase] update() SUCCESS for id:',
      id?.substring(0, 8) + '...'
    )
  },
}
