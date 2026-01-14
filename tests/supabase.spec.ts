
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SupabaseAdapter } from '../src/adapters/supabase';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();
  const select = vi.fn();
  const mockSupabase = {
    from: from.mockReturnThis(),
    select,
  };
  return {
    createClient: vi.fn(() => mockSupabase),
  };
});

describe('SupabaseAdapter', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should retry loading data on failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Network error');
    const selectSpy = vi.fn()
        .mockResolvedValueOnce({ data: null, error })
        .mockResolvedValueOnce({ data: null, error })
        .mockResolvedValueOnce({ data: [{ id: '1', name: 'Test Pump' }], error: null });

    supabase.from.mockReturnValue({
        select: selectSpy
    });

    const data = await SupabaseAdapter.load();

    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(selectSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(data).toEqual([{ id: '1', name: 'Test Pump' }]);

    consoleErrorSpy.mockRestore();
  });

  it('should throw an error after max retries', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Network error');
    const selectSpy = vi.fn().mockResolvedValue({ data: null, error });
    supabase.from.mockReturnValue({
        select: selectSpy,
    });

    await expect(SupabaseAdapter.load()).rejects.toThrow('Network error');

    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(selectSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(4);

    consoleErrorSpy.mockRestore();
  });
});
