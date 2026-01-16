import { Pump, DataAdapter } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ SANDBOX ADAPTER ACTIVE ⚠️⚠️⚠️
// ═══════════════════════════════════════════════════════════════════════════
console.warn(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  SANDBOX ADAPTER ACTIVE - ALL DATABASE OPERATIONS DISABLED  ⚠️           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  This adapter intercepts ALL database writes and discards them.              ║
║  Your data changes will NOT persist to Supabase.                             ║
║  All changes will be LOST on page refresh.                                   ║
║                                                                              ║
║  To save data to production:                                                 ║
║  1. Run 'pnpm build' instead of 'pnpm dev'                                   ║
║  2. Or deploy to production environment                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)
console.warn('⚠️ [Sandbox] Module loaded at:', new Date().toISOString())

export const SandboxAdapter: DataAdapter = {
  load: async () => {
    console.warn(
      '⚠️ [Sandbox] load() called - returning empty array (sandbox mode)'
    )
    // Sandbox should not load data, but if called, return empty or throw
    return []
  },
  replaceAll: async (rows?: Pump[]) => {
    console.warn(
      '⚠️ [Sandbox] replaceAll() called with',
      rows?.length ?? 0,
      'rows - DATA NOT SAVED (no-op)'
    )
    console.warn(
      '⚠️ [Sandbox] These rows would have been saved:',
      rows?.slice(0, 3),
      '...'
    )
    // No-op
  },
  upsertMany: async (rows?: Pump[]) => {
    console.warn(
      '⚠️ [Sandbox] upsertMany() called with',
      rows?.length ?? 0,
      'rows - DATA NOT SAVED (no-op)'
    )
    console.warn(
      '⚠️ [Sandbox] These rows would have been upserted:',
      rows?.slice(0, 3),
      '...'
    )
    // No-op
  },
  update: async (id?: string, patch?: Partial<Pump>) => {
    console.warn(
      '⚠️ [Sandbox] update() called for id:',
      id,
      '- DATA NOT SAVED (no-op)'
    )
    console.warn('⚠️ [Sandbox] This patch would have been applied:', patch)
    // No-op
  },
}
