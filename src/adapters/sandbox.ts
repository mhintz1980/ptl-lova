import { DataAdapter } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ SANDBOX ADAPTER ACTIVE ⚠️⚠️⚠️
// ═══════════════════════════════════════════════════════════════════════════
console.warn('[Sandbox] Adapter active - database operations disabled')

export const SandboxAdapter: DataAdapter = {
  load: async () => {
    // Sandbox should not load data, but if called, return empty or throw
    return []
  },
  replaceAll: async () => {
    // No-op
  },
  syncAll: async () => {
    // No-op
  },
  upsertMany: async () => {
    // No-op
  },
  update: async () => {
    // No-op
  },
}
