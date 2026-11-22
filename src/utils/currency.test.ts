import { describe, it, expect } from 'vitest'
import {
  calculateTransitiveRate,
  calculateTransitiveBreakdown,
  DEFAULT_BASE_CURRENCY,
} from './currency'
import { Currency } from '../types/simulation'

describe('Currency Utility & Transitive Dollar Triangulation', () => {
  const mockCurrencies: Currency[] = [
    DEFAULT_BASE_CURRENCY, // USD ($), baseExchangeRate: 1.0, isDefault: true
    {
      id: 'AUR',
      name: 'Aurum',
      symbol: '₲',
      color: '#E0A938',
      decimals: 2,
      baseExchangeRate: 1.5, // 1 AUR = $1.50 USD
    },
    {
      id: 'SLV',
      name: 'Silver',
      symbol: '☉',
      color: '#94A3B8',
      decimals: 2,
      baseExchangeRate: 0.5, // 1 SLV = $0.50 USD
    },
    {
      id: 'EUR',
      name: 'Euro',
      symbol: '€',
      color: '#38BDF8',
      decimals: 2,
      baseExchangeRate: 1.2, // 1 EUR = $1.20 USD
    },
  ]

  it('provides US Dollar as the default anchor currency with rate 1.0', () => {
    expect(DEFAULT_BASE_CURRENCY.id).toBe('USD')
    expect(DEFAULT_BASE_CURRENCY.symbol).toBe('$')
    expect(DEFAULT_BASE_CURRENCY.baseExchangeRate).toBe(1.0)
    expect(DEFAULT_BASE_CURRENCY.isDefault).toBe(true)
  })

  it('calculates identity rate for the same currency', () => {
    expect(calculateTransitiveRate('AUR', 'AUR', mockCurrencies)).toBe(1.0)
    expect(calculateTransitiveRate('USD', 'USD', mockCurrencies)).toBe(1.0)
  })

  it('calculates cross-rates transitively using Dollar as intermediate pivot', () => {
    // 1 AUR = $1.50 USD, 1 SLV = $0.50 USD
    // Transitive: 1 AUR -> $1.50 USD / $0.50 = 3.0 SLV
    const aurToSlv = calculateTransitiveRate('AUR', 'SLV', mockCurrencies)
    expect(aurToSlv).toBe(3.0)

    // Inverse: 1 SLV -> $0.50 USD / $1.50 = 0.333333 AUR
    const slvToAur = calculateTransitiveRate('SLV', 'AUR', mockCurrencies)
    expect(slvToAur).toBeCloseTo(1 / 3, 5)

    // EUR to AUR: 1.20 / 1.50 = 0.8
    const eurToAur = calculateTransitiveRate('EUR', 'AUR', mockCurrencies)
    expect(eurToAur).toBeCloseTo(0.8, 5)

    // Direct vs USD
    expect(calculateTransitiveRate('AUR', 'USD', mockCurrencies)).toBe(1.5)
    expect(calculateTransitiveRate('USD', 'AUR', mockCurrencies)).toBeCloseTo(1 / 1.5, 5)
  })

  it('computes detailed 2-step intermediate conversion breakdown', () => {
    // Convert 100 AUR to SLV
    const breakdown = calculateTransitiveBreakdown(100, 'AUR', 'SLV', mockCurrencies)

    expect(breakdown.sourceCurrency?.id).toBe('AUR')
    expect(breakdown.targetCurrency?.id).toBe('SLV')
    expect(breakdown.sourceRateInDollar).toBe(1.5)
    expect(breakdown.targetRateInDollar).toBe(0.5)

    // Step 1: 100 AUR * $1.50 = $150.00 USD intermediate valuation
    expect(breakdown.intermediateDollarAmount).toBe(150.0)

    // Step 2: $150.00 USD / $0.50 = 300 SLV
    expect(breakdown.targetAmount).toBe(300.0)
    expect(breakdown.effectiveRate).toBe(3.0)
  })
})
