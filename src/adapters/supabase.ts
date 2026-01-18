// src/adapters/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Pump, DataAdapter } from '../types'

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
      console.error(
        `❌ [Supabase] load() ERROR (attempt ${attempts}):`,
        error.message || 'Unknown error'
      )

      const delayIndex = Math.min(attempts - 1, backoffIntervals.length - 1)
      const delay = backoffIntervals[delayIndex]
      // Retry attempt logging
      console.warn(`⚠️ [Supabase] Retrying in ${delay}ms...`)

      if (attempts >= maxAttempts) {
        console.error(
          '❌ [Supabase] load() FAILED after',
          maxAttempts,
          'attempts - giving up'
        )
        throw error
      }

      await new Promise((res) => setTimeout(res, delay))
    }

    // This part should not be reachable, throw to ensure we never silently fail
    console.error('❌ [Supabase] load() - Exhausted retries without success')
    throw new Error('Failed to load data after maximum retries')
  },
  async replaceAll(rows: Pump[]) {
    console.log(
      '🔵 [Supabase] replaceAll() called with',
      rows.length,
      'rows at:',
      new Date().toISOString()
    )

    if (!supabase) {
      console.warn(
        '⚠️ [Supabase] replaceAll() - No client available, operation skipped'
      )
      return
    }

    // Delete all existing rows and then insert new ones
    // Note: This is a destructive operation for a full dataset replacement
    console.log(
      '🔵 [Supabase] replaceAll() - Step 1: Deleting all existing rows...'
    )
    const { error: deleteError } = await supabase
      .from('pump')
      .delete()
      .neq('id', '0') // delete all
    if (deleteError) {
      console.error('❌ [Supabase] replaceAll() DELETE ERROR:', deleteError)
      throw deleteError
    }
    console.log('✅ [Supabase] replaceAll() - Delete complete')

    if (rows.length) {
      console.log(
        '🔵 [Supabase] replaceAll() - Step 2: Upserting',
        rows.length,
        'new rows...'
      )
      const { error: upsertError } = await supabase.from('pump').upsert(rows)
      if (upsertError) {
        console.error('❌ [Supabase] replaceAll() UPSERT ERROR:', upsertError)
        throw upsertError
      }
      console.log(
        '✅ [Supabase] replaceAll() SUCCESS - Replaced',
        rows.length,
        'rows'
      )
    } else {
      console.log(
        '🔵 [Supabase] replaceAll() - No rows to insert (table cleared)'
      )
    }
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
        console.error('❌ [Supabase] upsertMany() ERROR:', error)
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
      console.error(
        '❌ [Supabase] update() ERROR for id',
        id?.substring(0, 8) + '...:',
        error
      )
      throw error
    }
    console.log(
      '✅ [Supabase] update() SUCCESS for id:',
      id?.substring(0, 8) + '...'
    )
  },
}
