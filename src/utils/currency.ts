import { Currency, SimulationNode } from '../types/simulation'

/**
 * Default Anchor Currency: US Dollar ($)
 * Acts as the intermediate transient pivot for all currency conversions.
 * Conversion factor: 1 USD * 1 = $1.00 USD (x = 1.0)
 */
export const DEFAULT_BASE_CURRENCY: Currency = {
  id: 'USD',
  name: 'US Dollar',
  symbol: '$',
  color: '#10B981', // Emerald green
  decimals: 2,
  baseExchangeRate: 1.0,
  unitsPerDollar: 1.0,
  isDefault: true,
}

/**
 * Returns the conversion factor x where: your currency * x = $1.00 USD.
 * For example:
 * - USD: x = 1.0
 * - INR: x = 83.0 (83 INR = $1.00 USD)
 * - EUR: x = 0.92 (0.92 EUR = $1.00 USD)
 */
export function getUnitsPerDollar(currency?: Currency | null): number {
  if (!currency) return 1.0
  if (currency.unitsPerDollar !== undefined && currency.unitsPerDollar > 0) {
    return currency.unitsPerDollar
  }
  if (currency.baseExchangeRate && currency.baseExchangeRate > 0) {
    return 1.0 / currency.baseExchangeRate
  }
  return 1.0
}

/**
 * Returns the value of 1 unit of currency in US Dollars ($).
 * Formula: 1 / unitsPerDollar
 * For example:
 * - USD: $1.00 USD
 * - INR: 1 / 83 = $0.012048 USD
 * - EUR: 1 / 0.92 = $1.086957 USD
 */
export function getBaseExchangeRate(currency?: Currency | null): number {
  if (!currency) return 1.0
  if (currency.baseExchangeRate && currency.baseExchangeRate > 0) {
    return currency.baseExchangeRate
  }
  if (currency.unitsPerDollar !== undefined && currency.unitsPerDollar > 0) {
    return 1.0 / currency.unitsPerDollar
  }
  return 1.0
}

/**
 * Converts any currency amount to US Dollar ($).
 */
export function convertToUsd(
  amount: number,
  currencyId: string,
  currencies: Currency[]
): number {
  if (currencyId === 'USD') return amount
  const cur = currencies.find((c) => c.id === currencyId)
  const rateInDollar = getBaseExchangeRate(cur)
  return amount * rateInDollar
}

/**
 * Converts a US Dollar ($) amount to any target currency.
 */
export function convertFromUsd(
  usdAmount: number,
  targetCurrencyId: string,
  currencies: Currency[]
): number {
  if (targetCurrencyId === 'USD') return usdAmount
  const cur = currencies.find((c) => c.id === targetCurrencyId)
  const unitsPerDollar = getUnitsPerDollar(cur)
  return usdAmount * unitsPerDollar
}

/**
 * Converts an amount from one currency to another using US Dollar as the intermediate relation.
 */
export function convertCurrency(
  amount: number,
  sourceCurrencyId: string,
  targetCurrencyId: string,
  currencies: Currency[]
): number {
  if (sourceCurrencyId === targetCurrencyId) return amount
  const usdVal = convertToUsd(amount, sourceCurrencyId, currencies)
  return convertFromUsd(usdVal, targetCurrencyId, currencies)
}

/**
 * Determines the primary currency wrapper of a node.
 */
export function getNodeCurrencyId(
  node: SimulationNode,
  currencies: Currency[]
): string {
  if (node.currencyId && currencies.some((c) => c.id === node.currencyId)) {
    return node.currencyId
  }
  const balanceKeys = Object.keys(node.balances)
  if (balanceKeys.length > 0 && currencies.some((c) => c.id === balanceKeys[0])) {
    return balanceKeys[0]
  }
  return currencies[0]?.id || 'USD'
}

/**
 * Returns the total money value of a node in US Dollars ($).
 * Unifies all balances without splitting.
 */
export function getNodeUsdValue(
  node: SimulationNode,
  currencies: Currency[]
): number {
  const entries = Object.entries(node.balances)
  if (entries.length === 0) return 0
  let totalUsd = 0
  for (const [curId, amount] of entries) {
    totalUsd += convertToUsd(amount, curId, currencies)
  }
  return totalUsd
}

/**
 * Returns the balance of a node in a specific currency (or its native currency wrapper).
 */
export function getNodeBalance(
  node: SimulationNode,
  displayCurrencyId?: string,
  currencies: Currency[] = []
): number {
  const nativeCurId = getNodeCurrencyId(node, currencies)
  const nativeBalance = node.balances[nativeCurId] ?? 0

  if (!displayCurrencyId || displayCurrencyId === 'native' || displayCurrencyId === nativeCurId) {
    return nativeBalance
  }

  // Convert via total USD value
  const totalUsd = getNodeUsdValue(node, currencies)
  return convertFromUsd(totalUsd, displayCurrencyId, currencies)
}

/**
 * Formats a currency value with its symbol and standard decimal places.
 */
export function formatCurrencyValue(
  amount: number,
  currency?: Currency | null,
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  const decimals = currency?.decimals ?? 2
  const formattedNum = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const symbol = options?.showSymbol !== false ? (currency?.symbol || '$') : ''
  const code = options?.showCode ? ` ${currency?.id || 'USD'}` : ''
  return `${symbol}${symbol ? ' ' : ''}${formattedNum}${code}`
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

  const sourceBase = sourceCur ? Math.max(0.000001, getBaseExchangeRate(sourceCur)) : 1.0
  const targetBase = targetCur ? Math.max(0.000001, getBaseExchangeRate(targetCur)) : 1.0

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

  const sourceRateInDollar = sourceCur ? Math.max(0.000001, getBaseExchangeRate(sourceCur)) : 1.0
  const targetRateInDollar = targetCur ? Math.max(0.000001, getBaseExchangeRate(targetCur)) : 1.0

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
