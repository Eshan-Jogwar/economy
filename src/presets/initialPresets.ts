import {
  SimulationState,
} from '../types/simulation'

/**
 * Preset 1: Dual Currency FX Bridge
 * Two realms with currencies 'AUR' and 'SLV', trade route node converting AUR to SLV at 1.5 rate and vice versa.
 */
export const dualCurrencyFxBridge = (): SimulationState => ({
  currencies: [
    { id: 'AUR', name: 'Aurum', symbol: '₲', color: '#E0A938', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'SLV', name: 'Silver', symbol: '☉', color: '#94A3B8', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [
    {
      id: 'realm-A',
      label: 'Solar Realm',
      role: 'agent',
      position: { x: 160, y: 200 },
      balances: { AUR: 1200, SLV: 50 },
    },
    {
      id: 'realm-B',
      label: 'Lunar Realm',
      role: 'agent',
      position: { x: 620, y: 200 },
      balances: { AUR: 80, SLV: 1500 },
    },
    {
      id: 'trade-node',
      label: 'Neutral Exchange Hub',
      role: 'market',
      position: { x: 390, y: 360 },
      balances: { AUR: 400, SLV: 600 },
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
      label: 'AUR → SLV (1.5)',
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
      label: 'SLV → AUR (0.667)',
    },
  ],
  tick: 0,
  isPlaying: false,
  speedMs: 100,
  history: [],
})

/**
 * Preset 2: Circular Economy with Bank & Sink
 * Currency 'CRED', Household, Producer, Central Bank, Consumer Sink.
 */
export const circularEconomyWithBankAndSink = (): SimulationState => ({
  currencies: [
    { id: 'CRED', name: 'Credit', symbol: '₡', color: '#10B981', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [
    {
      id: 'household',
      label: 'Household Cohort',
      role: 'agent',
      position: { x: 180, y: 160 },
      balances: { CRED: 600 },
    },
    {
      id: 'producer',
      label: 'Goods Producer',
      role: 'agent',
      position: { x: 620, y: 160 },
      balances: { CRED: 200 },
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
      balances: { CRED: 1500 },
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
      balances: { CRED: 50 },
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
 * Currencies 'ALPHA', 'BETA', 'GAMMA' with cyclic transactions and exchange rates.
 */
export const threeZoneTradeNetwork = (): SimulationState => ({
  currencies: [
    { id: 'ALPHA', name: 'Alpha', symbol: 'α', color: '#E74C3C', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'BETA', name: 'Beta', symbol: 'β', color: '#3498DB', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'GAMMA', name: 'Gamma', symbol: 'γ', color: '#2ECC71', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [
    {
      id: 'zone-alpha',
      label: 'Zone Alpha',
      role: 'agent',
      position: { x: 220, y: 160 },
      balances: { ALPHA: 1000, BETA: 0, GAMMA: 0 },
    },
    {
      id: 'zone-beta',
      label: 'Zone Beta',
      role: 'agent',
      position: { x: 620, y: 160 },
      balances: { ALPHA: 0, BETA: 1000, GAMMA: 0 },
    },
    {
      id: 'zone-gamma',
      label: 'Zone Gamma',
      role: 'agent',
      position: { x: 420, y: 390 },
      balances: { ALPHA: 0, BETA: 0, GAMMA: 1000 },
    },
  ],
  transactions: [
    // Alpha → Beta: ALPHA to BETA at rate 0.8
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
      label: 'ALPHA → BETA (0.8)',
    },
    // Beta → Gamma: BETA to GAMMA at rate 1.2
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
      label: 'BETA → GAMMA (1.2)',
    },
    // Gamma → Alpha: GAMMA to ALPHA at rate 0.9
    {
      id: 'gamma-to-alpha',
      source: 'zone-gamma',
      target: 'zone-alpha',
      sourceCurrencyId: 'GAMMA',
      targetCurrencyId: 'ALPHA',
      exchangeRate: 0.9,
      amountRule: { type: 'fixed', value: 50 },
      condition: { type: 'always' },
      active: true,
      label: 'GAMMA → ALPHA (0.9)',
    },
  ],
  tick: 0,
  isPlaying: false,
  speedMs: 100,
  history: [],
})

/**
 * Preset 4: Blank Canvas
 * Clean slate with standard currencies so users can build their own custom economic graph.
 */
export const blankCanvas = (): SimulationState => ({
  currencies: [
    { id: 'CRD', name: 'Credit', symbol: '₡', color: '#38bdf8', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'AUR', name: 'Aurum', symbol: '₲', color: '#fbbf24', decimals: 2, baseExchangeRate: 1.0 },
    { id: 'SLV', name: 'Silver', symbol: '☉', color: '#94a3b8', decimals: 2, baseExchangeRate: 1.0 },
  ],
  nodes: [],
  transactions: [],
  tick: 0,
  isPlaying: false,
  speedMs: 300,
  history: [],
})
