// src/adapters/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Pump, DataAdapter } from '../types'

// NOTE: This client is configured to use environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// which must be set in a .env file for this adapter to work.

const url = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

// Prevent crash if keys are missing (Local Mode)
const supabase = url && key ? createClient(url, key) : null

export const SupabaseAdapter: DataAdapter = {
  async load(): Promise<Pump[]> {
    if (!supabase) return []

    let attempts = 0
    const maxAttempts = 3
    const backoffIntervals = [500, 1000, 1500]

    while (attempts < maxAttempts) {
      const { data, error } = await supabase.from('pump').select('*')

      if (!error) {
        // Supabase returns snake_case, we assume the data is normalized to camelCase by the time it hits the store
        // For Lite, we cast and assume the DB schema matches the Pump interface (which it should, as per spec)
        return data as Pump[]
      }

      attempts++
      console.error(`Supabase load error (attempt ${attempts}):`, error)

      const delayIndex = Math.min(attempts - 1, backoffIntervals.length - 1)
      const delay = backoffIntervals[delayIndex]
      console.log(`Retrying in ${delay}ms...`)

      if (attempts >= maxAttempts) {
        console.error('Failed to load from Supabase after multiple attempts.')
        throw error
      }

      await new Promise((res) => setTimeout(res, delay))
    }

    // This part should not be reachable, but as a fallback:
    return []
  },
  async replaceAll(rows: Pump[]) {
    if (!supabase) return
    // Delete all existing rows and then insert new ones
    // Note: This is a destructive operation for a full dataset replacement
    const { error: deleteError } = await supabase
      .from('pump')
      .delete()
      .neq('id', '0') // delete all
    if (deleteError) {
      console.error('Supabase replaceAll delete error:', deleteError)
      throw deleteError
    }
    if (rows.length) {
      const { error: upsertError } = await supabase.from('pump').upsert(rows)
      if (upsertError) {
        console.error('Supabase replaceAll upsert error:', upsertError)
        throw upsertError
      }
    }
  },
  async upsertMany(rows: Pump[]) {
    if (!supabase) return
    if (rows.length) {
      const { error } = await supabase.from('pump').upsert(rows)
      if (error) {
        console.error('Supabase upsertMany error:', error)
        throw error
      }
    }
  },
  async update(id: string, patch: Partial<Pump>) {
    if (!supabase) return
    const { error } = await supabase.from('pump').update(patch).eq('id', id)
    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }
  },
}
