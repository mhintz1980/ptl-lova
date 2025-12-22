// src/lib/seed.getModelPrice.test.ts
import { describe, it, expect } from 'vitest'
import { getModelPrice } from './seed'

describe('getModelPrice', () => {
  it('returns correct price for known model DD-4S', () => {
    expect(getModelPrice('DD-4S')).toBe(20000)
  })

  it('returns correct price for known model RL200', () => {
    expect(getModelPrice('RL200')).toBe(45000)
  })

  it('returns fallback price for model with null price (HC-150-SAFE)', () => {
    // HC-150-SAFE has null price in catalog, fallback should apply
    const price = getModelPrice('HC-150-SAFE')
    expect(price).toBeGreaterThan(0)
  })

  it('returns 0 for unknown model', () => {
    expect(getModelPrice('UNKNOWN-MODEL')).toBe(0)
  })
})
