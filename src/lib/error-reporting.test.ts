import { describe, expect, it } from 'vitest'
import { formatErrorReport, getErrorMessage } from './error-reporting'

describe('error-reporting', () => {
  it('returns message from Error instances', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom')
  })

  it('returns message from string errors', () => {
    expect(getErrorMessage('Bad things')).toBe('Bad things')
  })

  it('falls back to unknown error for non-error values', () => {
    expect(getErrorMessage({ status: 500 })).toBe('Unknown error')
  })

  it('formats error reports with context', () => {
    const report = formatErrorReport(new Error('Failed'), {
      where: 'store.loadPumps',
      what: 'Failed to load pumps',
      correlationId: 'abc-123',
      request: {
        route: 'Dashboard',
        operation: 'load pumps',
        inputSummary: 'adapter=SupabaseAdapter',
      },
    })

    expect(report).toEqual({
      where: 'store.loadPumps',
      what: 'Failed to load pumps',
      correlationId: 'abc-123',
      request: {
        route: 'Dashboard',
        operation: 'load pumps',
        inputSummary: 'adapter=SupabaseAdapter',
      },
      message: 'Failed',
    })
  })
})
