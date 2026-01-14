import { Pump } from '../types'
import { DataAdapter, SandboxAdapter, SupabaseAdapter } from '../adapters'

interface SandboxState {
  isSandbox: boolean
  originalSnapshot: Pump[] | null
}

interface SandboxActions {
  enterSandbox: () => void
  commitSandbox: () => void
  exitSandbox: () => void
}

export type SandboxSlice = SandboxState & SandboxActions

export const createSandboxSlice = (
  set: (
    partial:
      | Partial<SandboxState & SandboxActions>
      | ((state: SandboxSlice) => Partial<SandboxState & SandboxActions>)
  ) => void,
  get: () => SandboxSlice & { pumps: Pump[]; adapter: DataAdapter }
): SandboxSlice => ({
  // State
  isSandbox: false,
  originalSnapshot: null,

  // Actions
  enterSandbox: () => {
    const state = get()
    if (state.isSandbox) return
    set({
      isSandbox: true,
      originalSnapshot: [...state.pumps],
      adapter: SandboxAdapter,
    })
  },

  commitSandbox: () => {
    const state = get()
    if (!state.isSandbox) return

    // Safety: Confirm before committing dev sandbox to production
    if (import.meta.env.DEV) {
      const confirmed = window.confirm(
        '⚠️ You are about to push sandbox data to PRODUCTION Supabase.\n\nAre you absolutely sure?'
      )
      if (!confirmed) return
    }

    // Restore real adapter based on environment
    const realAdapter =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
        ? SupabaseAdapter
        : (async () => {
            const { LocalAdapter } = await import('../adapters/LocalAdapter')
            return LocalAdapter
          })()

    // Persist current state to real adapter
    realAdapter.replaceAll(state.pumps)

    set({
      isSandbox: false,
      originalSnapshot: null,
      adapter: realAdapter,
    })
  },

  exitSandbox: () => {
    const state = get()
    if (!state.isSandbox || !state.originalSnapshot) return

    const realAdapter =
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
        ? SupabaseAdapter
        : (async () => {
            const { LocalAdapter } = await import('../adapters/LocalAdapter')
            return LocalAdapter
          })()

    set({
      isSandbox: false,
      pumps: state.originalSnapshot,
      originalSnapshot: null,
      adapter: realAdapter,
    })
  },
})
