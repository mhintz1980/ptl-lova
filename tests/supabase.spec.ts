import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted to create mock functions that can be used in vi.mock
const { mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockSelect, mockFrom }
})

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: mockFrom,
    })),
  }
})

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    // Mock environment variables so SupabaseAdapter initializes the client
    vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-key')

    // Clear mock history
    vi.clearAllMocks()
    mockSelect.mockReset()
    mockFrom.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('should retry loading data on failure', async () => {
    // 1. Setup mocks
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {}) // Adapter logs retries as warnings

    const error = new Error('Network error')
    // Fail 2 times, succeed on 3rd
    mockSelect
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({
        data: [{ id: '1', name: 'Test Pump' }],
        error: null,
      })

    // 2. Import the real adapter (dynamic import to pick up env vars)
    const { SupabaseAdapter } = await import('../src/adapters/supabase')

    // 3. Start the operation (do not await yet)
    const loadPromise = SupabaseAdapter.load()

    // 4. Fast-forward timers to skip backoff delays
    // We use runAllTimersAsync to handle the recursive async/await + setTimeout loop
    await vi.runAllTimersAsync()

    // 5. Await result
    const data = await loadPromise

    // 6. Assertions
    expect(mockFrom).toHaveBeenCalledTimes(3)
    expect(mockSelect).toHaveBeenCalledTimes(3)
    // Should log error for the first 2 failures
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    expect(data).toEqual([{ id: '1', name: 'Test Pump' }])

    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('should throw an error after max retries', async () => {
    // 1. Setup mocks
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const error = new Error('Network error')
    // Always fail
    mockSelect.mockResolvedValue({ data: null, error })

    // 2. Import the real adapter
    const { SupabaseAdapter } = await import('../src/adapters/supabase')

    // 3. Start operation
    const loadPromise = SupabaseAdapter.load()

    // 4. Handle rejection to prevent usage error during timer flush
    const safePromise = loadPromise.catch((e) => e)

    // 5. Fast-forward timers
    await vi.runAllTimersAsync()

    // 6. Await result (which is the caught error)
    const result = await safePromise

    // 7. Assert it failed with the correct error
    expect(result).toBe(error)

    // 8. Assertions
    // It tries 3 times (maxAttempts)
    expect(mockFrom).toHaveBeenCalledTimes(3)
    expect(mockSelect).toHaveBeenCalledTimes(3)

    // Logs expected
    expect(consoleErrorSpy.mock.calls.length).toBeGreaterThanOrEqual(4)

    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })
})
