/**
 * @file supabase-admin.ts
 * @description Supabase admin client using service role key for backend API routes
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables for service role access
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Type definition for Supabase admin client
 */
export type SupabaseAdminClient = ReturnType<typeof createClient>

/**
 * Singleton instance of the Supabase admin client
 * Used across backend API routes for admin operations (bypassing RLS)
 */
let adminClient: SupabaseAdminClient | null = null

/**
 * Get or create the Supabase admin client singleton
 * @returns SupabaseAdminClient instance or null if credentials are missing
 */
export function getSupabaseAdmin(): SupabaseAdminClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      '⚠️ [Supabase Admin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
    return null
  }

  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        // Admin client should not auto-refresh or persist sessions
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log('✅ [Supabase Admin] Admin client initialized')
  }

  return adminClient
}

/**
 * Get the Supabase admin client, throwing if not configured
 * Use this when the admin client is required (not optional)
 * @returns SupabaseAdminClient instance
 * @throws Error if credentials are missing
 */
export function requireSupabaseAdmin(): SupabaseAdminClient {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error(
      'Supabase admin client not configured. Check environment variables.'
    )
  }
  return client
}
