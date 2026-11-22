import { describe, it, expect } from 'vitest'
import {
  calculateTransitiveRate,
  calculateTransitiveBreakdown,
  DEFAULT_BASE_CURRENCY,
  getUnitsPerDollar,
  getBaseExchangeRate,
  convertToUsd,
  convertFromUsd,
  convertCurrency,
  getNodeCurrencyId,
  getNodeBalance,
  getNodeUsdValue,
} from './currency'
import { Currency, SimulationNode } from '../types/simulation'

describe('Currency Utility & Transitive Dollar Triangulation', () => {
  const mockCurrencies: Currency[] = [
    DEFAULT_BASE_CURRENCY, // USD ($), baseExchangeRate: 1.0, unitsPerDollar: 1.0, isDefault: true
    {
      id: 'AUR',
      name: 'Aurum',
      symbol: '₲',
      color: '#E0A938',
      decimals: 2,
      baseExchangeRate: 1.5, // 1 AUR = $1.50 USD
      unitsPerDollar: 1 / 1.5,
    },
    {
      id: 'SLV',
      name: 'Silver',
      symbol: '☉',
      color: '#94A3B8',
      decimals: 2,
      baseExchangeRate: 0.5, // 1 SLV = $0.50 USD
      unitsPerDollar: 2.0, // 2 SLV = $1.00 USD
    },
    {
      id: 'INR',
      name: 'Indian Rupee',
      symbol: '₹',
      color: '#F59E0B',
      decimals: 2,
      unitsPerDollar: 83.0, // 83 INR = $1.00 USD (your currency * x = 1 dollar)
      baseExchangeRate: 1 / 83.0,
    },
    {
      id: 'EUR',
      name: 'Euro',
      symbol: '€',
      color: '#38BDF8',
      decimals: 2,
      unitsPerDollar: 0.92, // 0.92 EUR = $1.00 USD
      baseExchangeRate: 1 / 0.92,
    },
  ]

  it('provides US Dollar as the default anchor currency with rate 1.0', () => {
    expect(DEFAULT_BASE_CURRENCY.id).toBe('USD')
    expect(DEFAULT_BASE_CURRENCY.symbol).toBe('$')
    expect(DEFAULT_BASE_CURRENCY.baseExchangeRate).toBe(1.0)
    expect(DEFAULT_BASE_CURRENCY.unitsPerDollar).toBe(1.0)
    expect(DEFAULT_BASE_CURRENCY.isDefault).toBe(true)
  })

  it('correctly calculates conversion factor x and unit value in USD', () => {
    const inr = mockCurrencies.find((c) => c.id === 'INR')!
    expect(getUnitsPerDollar(inr)).toBe(83.0)
    // 1 INR in USD is 1/83
    expect(getBaseExchangeRate(inr)).toBeCloseTo(1 / 83.0, 5)

    const eur = mockCurrencies.find((c) => c.id === 'EUR')!
    expect(getUnitsPerDollar(eur)).toBe(0.92)
    // 1 EUR in USD is 1/0.92 = 1.08695
    expect(getBaseExchangeRate(eur)).toBeCloseTo(1 / 0.92, 4)
  })

  it('converts currency amounts to US Dollar and back seamlessly', () => {
    // If someone has 8,300 INR, in dollars it is $100.00 USD
    const inrToUsd = convertToUsd(8300, 'INR', mockCurrencies)
    expect(inrToUsd).toBeCloseTo(100.0, 2)

    // If someone has $100.00 USD, in INR it is 8,300 INR
    const usdToInr = convertFromUsd(100.0, 'INR', mockCurrencies)
    expect(usdToInr).toBeCloseTo(8300.0, 2)

    // Direct conversion between two wrappers via USD pivot: 8,300 INR -> 92 EUR
    const inrToEur = convertCurrency(8300, 'INR', 'EUR', mockCurrencies)
    expect(inrToEur).toBeCloseTo(92.0, 2)
  })

  it('determines node currency wrapper and retrieves unified balance and USD valuation', () => {
    const nodeWithInr: SimulationNode = {
      id: 'node-india',
      label: 'Mumbai Trading Post',
      role: 'node',
      currencyId: 'INR',
      position: { x: 100, y: 100 },
      balances: { INR: 8300 },
    }

    expect(getNodeCurrencyId(nodeWithInr, mockCurrencies)).toBe('INR')
    // Balance in native wrapper
    expect(getNodeBalance(nodeWithInr, 'INR', mockCurrencies)).toBe(8300)
    // Value in US Dollar: 8300 INR = $100.00 USD
    expect(getNodeUsdValue(nodeWithInr, mockCurrencies)).toBeCloseTo(100.0, 2)
    // Viewing the same node's money in EUR: 92 EUR
    expect(getNodeBalance(nodeWithInr, 'EUR', mockCurrencies)).toBeCloseTo(92.0, 2)
    // Viewing the same node's money in USD: 100 USD
    expect(getNodeBalance(nodeWithInr, 'USD', mockCurrencies)).toBeCloseTo(100.0, 2)
  })

  it('calculates cross-rates transitively using Dollar as intermediate pivot', () => {
    const aurToSlv = calculateTransitiveRate('AUR', 'SLV', mockCurrencies)
    expect(aurToSlv).toBe(3.0)

    const slvToAur = calculateTransitiveRate('SLV', 'AUR', mockCurrencies)
    expect(slvToAur).toBeCloseTo(1 / 3, 5)

    // Direct vs USD
    expect(calculateTransitiveRate('AUR', 'USD', mockCurrencies)).toBe(1.5)
    expect(calculateTransitiveRate('USD', 'AUR', mockCurrencies)).toBeCloseTo(1 / 1.5, 5)
  })

  it('computes detailed 2-step intermediate conversion breakdown', () => {
    const breakdown = calculateTransitiveBreakdown(100, 'AUR', 'SLV', mockCurrencies)
    expect(breakdown.sourceCurrency?.id).toBe('AUR')
    expect(breakdown.targetCurrency?.id).toBe('SLV')
    expect(breakdown.sourceRateInDollar).toBe(1.5)
    expect(breakdown.targetRateInDollar).toBe(0.5)
    expect(breakdown.intermediateDollarAmount).toBe(150.0)
    expect(breakdown.targetAmount).toBe(300.0)
    expect(breakdown.effectiveRate).toBe(3.0)
  })
})
