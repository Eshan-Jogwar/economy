export type Currency = {
  id: string
  name: string
  symbol: string
  color: string
  decimals: number
  baseExchangeRate: number
  isDefault?: boolean
}

export type NodeRole = 'generic' | 'agent' | 'market' | 'bank' | 'mint' | 'sink'

export type NodeRule = {
  type: 'none' | 'mint' | 'drain'
  currencyId: string
  amount: number
}

export type SimulationNode = {
  id: string
  label: string
  role: NodeRole
  position: { x: number; y: number }
  balances: Record<string, number>
  rule?: NodeRule
}

export type TransactionAmountRule = {
  type: 'fixed' | 'percent_balance'
  value: number
}

export type TransactionCondition = {
  type: 'always' | 'min_balance'
  threshold?: number
}

export type SimulationTransaction = {
  id: string
  source: string
  target: string
  sourceCurrencyId: string
  targetCurrencyId: string
  exchangeRate: number
  amountRule: TransactionAmountRule
  condition: TransactionCondition
  active: boolean
  label?: string
}

export type SimulationState = {
  currencies: Currency[]
  defaultCurrencyId?: string
  nodes: SimulationNode[]
  transactions: SimulationTransaction[]
  tick: number
  isPlaying: boolean
  speedMs: number
  history: TickSnapshot[]
}

export type TransactionExecutionEvent = {
  id: string
  tick: number
  transactionId: string
  sourceNodeId: string
  targetNodeId: string
  sourceAmount: number
  sourceCurrencyId: string
  targetAmount: number
  targetCurrencyId: string
  exchangeRate: number
  timestamp: number
}

export type TickSnapshot = {
  tick: number
  totalBalances: Record<string, number>
  totalVolume: Record<string, number>
  events: TransactionExecutionEvent[]
}