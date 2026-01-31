import { describe, it, expect } from 'vitest'
import { countWorkingDays } from './working-days'

describe('working-days', () => {
  it('counts across year boundaries with holidays', () => {
    const start = new Date('2026-12-30')
    const end = new Date('2027-01-05')
    expect(countWorkingDays(start, end)).toBe(4)
  })
})
