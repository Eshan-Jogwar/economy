import { Currency } from '../types/simulation'

/**
 * Default Anchor Currency: US Dollar ($)
 * Acts as the intermediate transient pivot for all currency conversions.
 */
export const DEFAULT_BASE_CURRENCY: Currency = {
  id: 'USD',
  name: 'US Dollar',
  symbol: '$',
  color: '#10B981', // Emerald green
  decimals: 2,
  baseExchangeRate: 1.0,
  isDefault: true,
}

/**
 * Calculates the transitive exchange rate from source currency to target currency
 * using the base currency (Dollar) as the intermediate relation.
 *
 * Formula:
 * 1 unit of Source = Source.baseExchangeRate in USD
 * 1 unit of Target = Target.baseExchangeRate in USD
 * Therefore, 1 unit of Source = (Source.baseExchangeRate / Target.baseExchangeRate) units of Target
 */
export function calculateTransitiveRate(
  sourceCurrencyId: string,
  targetCurrencyId: string,
  currencies: Currency[]
): number {
  if (sourceCurrencyId === targetCurrencyId) {
    return 1.0
  }

  const sourceCur = currencies.find((c) => c.id === sourceCurrencyId)
  const targetCur = currencies.find((c) => c.id === targetCurrencyId)

  const sourceBase = sourceCur ? Math.max(0.000001, sourceCur.baseExchangeRate) : 1.0
  const targetBase = targetCur ? Math.max(0.000001, targetCur.baseExchangeRate) : 1.0

  return sourceBase / targetBase
}

/**
 * Computes the full two-step transitive conversion breakdown through intermediate Dollar.
 */
export function calculateTransitiveBreakdown(
  amount: number,
  sourceCurrencyId: string,
  targetCurrencyId: string,
  currencies: Currency[]
): {
  sourceCurrency?: Currency
  targetCurrency?: Currency
  baseCurrency?: Currency
  sourceRateInDollar: number
  intermediateDollarAmount: number
  targetRateInDollar: number
  targetAmount: number
  effectiveRate: number
} {
  const sourceCur = currencies.find((c) => c.id === sourceCurrencyId)
  const targetCur = currencies.find((c) => c.id === targetCurrencyId)
  const baseCur = currencies.find((c) => c.isDefault) || currencies.find((c) => c.id === 'USD') || DEFAULT_BASE_CURRENCY

  const sourceRateInDollar = sourceCur ? Math.max(0.000001, sourceCur.baseExchangeRate) : 1.0
  const targetRateInDollar = targetCur ? Math.max(0.000001, targetCur.baseExchangeRate) : 1.0

  const intermediateDollarAmount = amount * sourceRateInDollar
  const effectiveRate = sourceRateInDollar / targetRateInDollar
  const targetAmount = intermediateDollarAmount / targetRateInDollar

  return {
    sourceCurrency: sourceCur,
    targetCurrency: targetCur,
    baseCurrency: baseCur,
    sourceRateInDollar,
    intermediateDollarAmount,
    targetRateInDollar,
    targetAmount,
    effectiveRate,
  }
}
