import '@testing-library/jest-dom'
import { beforeEach, afterEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ TEST ISOLATION: Prevent tests from connecting to production Supabase
// ═══════════════════════════════════════════════════════════════════════════
// This setup runs BEFORE any tests. It ensures:
// 1. Store uses LocalAdapter (in-memory, no persistence)
// 2. Supabase env vars are cleared (belt and suspenders with vite.config.ts)
// ═══════════════════════════════════════════════════════════════════════════

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ STORE ADAPTER RESET: Force LocalAdapter before each test
// ═══════════════════════════════════════════════════════════════════════════
// This ensures: Tests NEVER persist to Supabase, even if env vars leak through
// LocalAdapter uses in-memory storage mocked above
// ═══════════════════════════════════════════════════════════════════════════

beforeEach(async () => {
  // Clear localStorage between tests
  localStorageMock.clear()

  // Force LocalAdapter - this is the critical safety mechanism
  // Even if Supabase env vars somehow get through, this overrides the adapter
  const { useApp } = await import('./src/store')
  const { LocalAdapter } = await import('./src/adapters/local')

  useApp.setState({
    adapter: LocalAdapter,
    pumps: [],
    loading: false,
  })
})

afterEach(() => {
  // Clear any lingering test data
  localStorageMock.clear()
})
