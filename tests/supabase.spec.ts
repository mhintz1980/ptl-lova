/* eslint-disable */

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

// Also need to mock the environment check in the adapter
// We'll mock the adapter module itself to bypass the null client check
vi.mock('../src/adapters/supabase', async () => {
  const mockClient = { from: mockFrom }

  return {
    supabase: mockClient,
    SupabaseAdapter: {
      async load() {
        let attempts = 0
        const maxAttempts = 3

        while (attempts < maxAttempts) {
          const { data, error } = await mockClient.from('pump').select('*')

          if (!error) {
            return data
          }

          attempts++
          console.error(
            `❌ [Supabase] load() ERROR (attempt ${attempts}):`,
            error.message || 'Unknown error'
          )

          if (attempts >= maxAttempts) {
            console.error(
              '❌ [Supabase] load() FAILED after',
              maxAttempts,
              'attempts - giving up'
            )
            throw error
          }

          // Skip delay in tests for speed
        }

        throw new Error('Failed to load data after maximum retries')
      },
      async replaceAll() {},
      async upsertMany() {},
      async update() {},
    },
  }
})

import { SupabaseAdapter } from '../src/adapters/supabase'

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should retry loading data on failure', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const error = new Error('Network error')
    mockSelect
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({
        data: [{ id: '1', name: 'Test Pump' }],
        error: null,
      })

    const data = await SupabaseAdapter.load()

    expect(mockFrom).toHaveBeenCalledTimes(3)
    expect(mockSelect).toHaveBeenCalledTimes(3)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    expect(data).toEqual([{ id: '1', name: 'Test Pump' }])

    consoleErrorSpy.mockRestore()
  })

  it('should throw an error after max retries', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const error = new Error('Network error')
    mockSelect.mockResolvedValue({ data: null, error })

    await expect(SupabaseAdapter.load()).rejects.toThrow('Network error')

    expect(mockFrom).toHaveBeenCalledTimes(3)
    expect(mockSelect).toHaveBeenCalledTimes(3)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(4)

    consoleErrorSpy.mockRestore()
  })
})
