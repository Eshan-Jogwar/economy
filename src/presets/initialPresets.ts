import {
  SimulationState,
} from '../types/simulation'

/**
 * Preset 1: Dual Currency FX Bridge
 * Two realms with currencies 'AUR' and 'SLV', trade route node converting AUR to SLV at 1.5 rate and vice versa.
 * Uses default USD as the base anchor (1 AUR = $1.50 USD, 1 SLV = $1.00 USD, so 1 AUR = 1.5 SLV via USD intermediate).
 */
export const dualCurrencyFxBridge = (): SimulationState => ({
  defaultCurrencyId: 'USD',
  currencies: [
    { id: 'USD', name: 'US Dollar', symbol: '$', color: '#10B981', decimals: 2, baseExchangeRate: 1.0, isDefault: true },
    { id: 'AUR', name: 'Aurum', symbol: '₲', color: '#E0A938', decimals: 2, baseExchangeRate: 1.5 },
    { id: 'SLV', name: 'Silver', symbol: '☉', color: '#94A3B8', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [
    {
      id: 'realm-A',
      label: 'Solar Realm',
      role: 'agent',
      position: { x: 160, y: 200 },
      balances: { USD: 500, AUR: 1200, SLV: 50 },
    },
    {
      id: 'realm-B',
      label: 'Lunar Realm',
      role: 'agent',
      position: { x: 620, y: 200 },
      balances: { USD: 500, AUR: 80, SLV: 1500 },
    },
    {
      id: 'trade-node',
      label: 'Neutral Exchange Hub',
      role: 'market',
      position: { x: 390, y: 360 },
      balances: { USD: 1000, AUR: 400, SLV: 600 },
      rule: { type: 'none', currencyId: 'AUR', amount: 0 },
    },
  ],
  transactions: [
    {
      id: 'AUR-to-SLV',
      source: 'realm-A',
      target: 'realm-B',
      sourceCurrencyId: 'AUR',
      targetCurrencyId: 'SLV',
      exchangeRate: 1.5,
      amountRule: { type: 'fixed', value: 100 },
      condition: { type: 'always' },
      active: true,
      label: 'AUR → SLV (1.5 via USD)',
    },
    {
      id: 'SLV-to-AUR',
      source: 'realm-B',
      target: 'realm-A',
      sourceCurrencyId: 'SLV',
      targetCurrencyId: 'AUR',
      exchangeRate: 1 / 1.5,
      amountRule: { type: 'fixed', value: 100 },
      condition: { type: 'always' },
      active: true,
      label: 'SLV → AUR (0.667 via USD)',
    },
  ],
  tick: 0,
  isPlaying: false,
  speedMs: 100,
  history: [],
})

/**
 * Preset 2: Circular Economy with Bank & Sink
 * Currency 'CRED' and base 'USD', Household, Producer, Central Bank, Consumer Sink.
 */
export const circularEconomyWithBankAndSink = (): SimulationState => ({
  defaultCurrencyId: 'USD',
  currencies: [
    { id: 'USD', name: 'US Dollar', symbol: '$', color: '#10B981', decimals: 2, baseExchangeRate: 1.0, isDefault: true },
    { id: 'CRED', name: 'Credit', symbol: '₡', color: '#38bdf8', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [
    {
      id: 'household',
      label: 'Household Cohort',
      role: 'agent',
      position: { x: 180, y: 160 },
      balances: { USD: 300, CRED: 600 },
    },
    {
      id: 'producer',
      label: 'Goods Producer',
      role: 'agent',
      position: { x: 620, y: 160 },
      balances: { USD: 100, CRED: 200 },
      rule: {
        type: 'mint',
        currencyId: 'CRED',
        amount: 30,
      },
    },
    {
      id: 'central-bank',
      label: 'Liquidity Reserve',
      role: 'bank',
      position: { x: 400, y: 70 },
      balances: { USD: 2500, CRED: 1500 },
      rule: {
        type: 'none',
        currencyId: 'CRED',
        amount: 0,
      },
    },
    {
      id: 'consumer-sink',
      label: 'Capital Depository',
      role: 'sink',
      position: { x: 400, y: 350 },
      balances: { USD: 50, CRED: 50 },
      rule: {
        type: 'drain',
        currencyId: 'CRED',
        amount: 15,
      },
    },
  ],
  transactions: [
    {
      id: 'household-to-producer',
      source: 'household',
      target: 'producer',
      sourceCurrencyId: 'CRED',
      targetCurrencyId: 'CRED',
      exchangeRate: 1.0,
      amountRule: { type: 'percent_balance', value: 10 },
      condition: { type: 'min_balance', threshold: 50 },
      active: true,
      label: 'Household gives 10% to Producer',
    },
    {
      id: 'producer-to-sink',
      source: 'producer',
      target: 'consumer-sink',
      sourceCurrencyId: 'CRED',
      targetCurrencyId: 'CRED',
      exchangeRate: 1.0,
      amountRule: { type: 'fixed', value: 30 },
      condition: { type: 'always' },
      active: true,
      label: 'Producer drains 30 CRED to Sink',
    },
  ],
  tick: 0,
  isPlaying: false,
  speedMs: 100,
  history: [],
})

/**
 * Preset 3: Three-Zone Trade Network
 * Currencies 'ALPHA', 'BETA', 'GAMMA' with USD as default intermediate anchor.
 */
export const threeZoneTradeNetwork = (): SimulationState => ({
  defaultCurrencyId: 'USD',
  currencies: [
    { id: 'USD', name: 'US Dollar', symbol: '$', color: '#10B981', decimals: 2, baseExchangeRate: 1.0, isDefault: true },
    { id: 'ALPHA', name: 'Alpha', symbol: 'α', color: '#E74C3C', decimals: 2, baseExchangeRate: 1.2 },
    { id: 'BETA', name: 'Beta', symbol: 'β', color: '#3498DB', decimals: 2, baseExchangeRate: 1.5 },
    { id: 'GAMMA', name: 'Gamma', symbol: 'γ', color: '#2ECC71', decimals: 2, baseExchangeRate: 1.25 },
  ],
  nodes: [
    {
      id: 'zone-alpha',
      label: 'Zone Alpha',
      role: 'agent',
      position: { x: 220, y: 160 },
      balances: { USD: 400, ALPHA: 1000, BETA: 0, GAMMA: 0 },
    },
    {
      id: 'zone-beta',
      label: 'Zone Beta',
      role: 'agent',
      position: { x: 620, y: 160 },
      balances: { USD: 400, ALPHA: 0, BETA: 1000, GAMMA: 0 },
    },
    {
      id: 'zone-gamma',
      label: 'Zone Gamma',
      role: 'agent',
      position: { x: 420, y: 390 },
      balances: { USD: 400, ALPHA: 0, BETA: 0, GAMMA: 1000 },
    },
  ],
  transactions: [
    // Alpha → Beta: ALPHA to BETA at rate 0.8 (1.2 / 1.5)
    {
      id: 'alpha-to-beta',
      source: 'zone-alpha',
      target: 'zone-beta',
      sourceCurrencyId: 'ALPHA',
      targetCurrencyId: 'BETA',
      exchangeRate: 0.8,
      amountRule: { type: 'fixed', value: 50 },
      condition: { type: 'always' },
      active: true,
      label: 'ALPHA → BETA (0.8 via USD)',
    },
    // Beta → Gamma: BETA to GAMMA at rate 1.2 (1.5 / 1.25)
    {
      id: 'beta-to-gamma',
      source: 'zone-beta',
      target: 'zone-gamma',
      sourceCurrencyId: 'BETA',
      targetCurrencyId: 'GAMMA',
      exchangeRate: 1.2,
      amountRule: { type: 'fixed', value: 50 },
      condition: { type: 'always' },
      active: true,
      label: 'BETA → GAMMA (1.2 via USD)',
    },
    // Gamma → Alpha: GAMMA to ALPHA at rate 1.042 (1.25 / 1.2)
    {
      id: 'gamma-to-alpha',
      source: 'zone-gamma',
      target: 'zone-alpha',
      sourceCurrencyId: 'GAMMA',
      targetCurrencyId: 'ALPHA',
      exchangeRate: 1.042,
      amountRule: { type: 'fixed', value: 50 },
      condition: { type: 'always' },
      active: true,
      label: 'GAMMA → ALPHA (1.04 via USD)',
    },
  ],
  tick: 0,
  isPlaying: false,
  speedMs: 100,
  history: [],
})

/**
 * Preset 4: Blank Canvas
 * Clean slate with USD as default intermediate anchor, along with standard trade currencies.
 */
export const blankCanvas = (): SimulationState => ({
  defaultCurrencyId: 'USD',
  currencies: [
    { id: 'USD', name: 'US Dollar', symbol: '$', color: '#10B981', decimals: 2, baseExchangeRate: 1.0, isDefault: true },
    { id: 'CRD', name: 'Credit', symbol: '₡', color: '#38bdf8', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'AUR', name: 'Aurum', symbol: '₲', color: '#fbbf24', decimals: 2, baseExchangeRate: 1.5 },
    { id: 'SLV', name: 'Silver', symbol: '☉', color: '#94a3b8', decimals: 2, baseExchangeRate: 0.5 },
  ],
  nodes: [],
  transactions: [],
  tick: 0,
  isPlaying: false,
  speedMs: 300,
  history: [],
})
