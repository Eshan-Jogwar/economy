import { describe, it, expect } from 'vitest'
import {
  executeTick,
  calculateTotalSupply,
  calculateVelocity,
  BaseTickStepNode,
  NodeRulesStepNode,
  TransactionsStepNode,
  VolumeMetricsStepNode,
  HistorySnapshotStepNode,
  TickExecutionChain,
  TickExecutionContext,
} from './simulationEngine'
import { SimulationState, SimulationNode, SimulationTransaction } from '../types/simulation'

const mockCurrencies = [
  { id: 'USD', name: 'US Dollar', symbol: '$', color: '#10B981', decimals: 2, baseExchangeRate: 1.0 },
  { id: 'EUR', name: 'Euro', symbol: '€', color: '#3B82F6', decimals: 2, baseExchangeRate: 1.1 },
]

function createInitialState(): SimulationState {
  return {
    currencies: mockCurrencies,
    nodes: [
      {
        id: 'node_1',
        label: 'Node 1',
        role: 'node',
        position: { x: 0, y: 0 },
        currencyId: 'USD',
        balances: { USD: 100 },
        rule: { type: 'mint', currencyId: 'USD', amount: 10 },
      },
      {
        id: 'node_2',
        label: 'Node 2',
        role: 'node',
        position: { x: 100, y: 0 },
        currencyId: 'USD',
        balances: { USD: 50 },
      },
    ],
    transactions: [
      {
        id: 'tx_1',
        source: 'node_1',
        target: 'node_2',
        sourceCurrencyId: 'USD',
        targetCurrencyId: 'USD',
        exchangeRate: 1.0,
        amountRule: { type: 'fixed', value: 20 },
        condition: { type: 'always' },
        active: true,
      },
    ],
    tick: 0,
    isPlaying: false,
    speedMs: 1000,
    history: [],
  }
}

describe('Chain of Responsibility - Simulation Engine', () => {
  it('executes full tick using the default chain', () => {
    const initialState = createInitialState()
    const { nextState, events } = executeTick(initialState)

    // Tick incremented
    expect(nextState.tick).toBe(1)

    // Node 1: started at 100 + 10 (mint rule in NodeRulesStepNode) - 20 (transfer in TransactionsStepNode) = 90
    const node1 = nextState.nodes.find((n) => n.id === 'node_1')
    expect(node1?.balances.USD).toBe(90)

    // Node 2: started at 50 + 20 (transfer in TransactionsStepNode) = 70
    const node2 = nextState.nodes.find((n) => n.id === 'node_2')
    expect(node2?.balances.USD).toBe(70)

    // Transaction event emitted
    expect(events.length).toBe(1)
    expect(events[0].sourceAmount).toBe(20)
    expect(events[0].targetAmount).toBe(20)

    // Snapshot recorded in history
    expect(nextState.history.length).toBe(1)
    expect(nextState.history[0].tick).toBe(1)
    expect(nextState.history[0].totalVolume['USD']).toBe(20)
  })

  it('NodeRulesStepNode handles mint and drain in isolation', () => {
    const nodeRulesNode = new NodeRulesStepNode()
    const context: TickExecutionContext = {
      initialState: createInitialState(),
      nodes: [
        {
          id: 'n1',
          label: 'Minter',
          role: 'node',
          position: { x: 0, y: 0 },
          currencyId: 'USD',
          balances: { USD: 50 },
          rule: { type: 'mint', currencyId: 'USD', amount: 25 },
        },
        {
          id: 'n2',
          label: 'Drainer',
          role: 'node',
          position: { x: 0, y: 0 },
          currencyId: 'USD',
          balances: { USD: 50 },
          rule: { type: 'drain', currencyId: 'USD', amount: 15 },
        },
      ],
      events: [],
      totalVolume: {},
    }

    nodeRulesNode.handle(context)

    expect(context.nodes[0].balances.USD).toBe(75)
    expect(context.nodes[1].balances.USD).toBe(35)
  })

  it('VolumeMetricsStepNode correctly aggregates volume from events', () => {
    const volumeNode = new VolumeMetricsStepNode()
    const context: TickExecutionContext = {
      initialState: createInitialState(),
      nodes: [],
      events: [
        {
          id: 'e1',
          tick: 1,
          transactionId: 'tx1',
          sourceNodeId: 'n1',
          targetNodeId: 'n2',
          sourceAmount: 30,
          sourceCurrencyId: 'USD',
          targetAmount: 30,
          targetCurrencyId: 'USD',
          exchangeRate: 1,
          timestamp: Date.now(),
        },
        {
          id: 'e2',
          tick: 1,
          transactionId: 'tx2',
          sourceNodeId: 'n2',
          targetNodeId: 'n3',
          sourceAmount: 10,
          sourceCurrencyId: 'EUR',
          targetAmount: 11,
          targetCurrencyId: 'USD',
          exchangeRate: 1.1,
          timestamp: Date.now(),
        },
      ],
      totalVolume: {},
    }

    volumeNode.handle(context)

    expect(context.totalVolume['USD']).toBe(41) // 30 + 11
    expect(context.totalVolume['EUR']).toBe(10)
  })

  it('HistorySnapshotStepNode creates snapshot and caps history to 100 items', () => {
    const historyNode = new HistorySnapshotStepNode()

    // Prepopulate 105 history snapshots
    const priorHistory = Array.from({ length: 105 }, (_, i) => ({
      tick: i,
      totalBalances: { USD: 100 },
      totalVolume: { USD: 10 },
      events: [],
    }))

    const state = { ...createInitialState(), history: priorHistory }
    const context: TickExecutionContext = {
      initialState: state,
      nodes: state.nodes,
      events: [],
      totalVolume: { USD: 5 },
    }

    historyNode.handle(context)

    expect(context.nextState).toBeDefined()
    expect(context.nextState?.history.length).toBe(100)
    expect(context.nextState?.tick).toBe(state.tick + 1)
  })

  it('allows inserting a custom step node into the chain', () => {
    // Custom tax collector step node that takes 10% from all nodes
    class TaxStepNode extends BaseTickStepNode {
      handle(ctx: TickExecutionContext): void {
        ctx.nodes = ctx.nodes.map((node) => ({
          ...node,
          balances: {
            ...node.balances,
            USD: (node.balances.USD || 0) * 0.9,
          },
        }))
        this.forward(ctx)
      }
    }

    const nodeRules = new NodeRulesStepNode()
    const taxStep = new TaxStepNode()
    const transactions = new TransactionsStepNode()
    const volume = new VolumeMetricsStepNode()
    const history = new HistorySnapshotStepNode()

    // Build custom chain with tax step inserted right after rules
    nodeRules
      .setNext(taxStep)
      .setNext(transactions)
      .setNext(volume)
      .setNext(history)

    const customChain = new TickExecutionChain(nodeRules)
    const state = createInitialState()
    // node_1 starts with 100, mints 10 = 110. Tax takes 10% => 99. Then transfers 20 => 79.
    const { nextState } = customChain.execute(state)

    const node1 = nextState.nodes.find((n) => n.id === 'node_1')
    expect(node1?.balances.USD).toBe(79)
  })

  it('calculateVelocity computes currency velocity accurately', () => {
    const history = [
      { tick: 1, totalBalances: { USD: 100 }, totalVolume: { USD: 20 }, events: [] },
      { tick: 2, totalBalances: { USD: 100 }, totalVolume: { USD: 30 }, events: [] },
    ]
    // Total volume = 50, average supply = 100 => velocity = 0.5
    expect(calculateVelocity(history, 'USD')).toBe(0.5)
    expect(calculateVelocity([], 'USD')).toBe(0)
  })

  it('calculateTotalSupply aggregates across all nodes', () => {
    const nodes: SimulationNode[] = [
      { id: '1', label: '1', role: 'node', position: { x: 0, y: 0 }, balances: { USD: 100, EUR: 50 } },
      { id: '2', label: '2', role: 'node', position: { x: 0, y: 0 }, balances: { USD: 200 } },
    ]
    const totals = calculateTotalSupply(nodes)
    expect(totals.USD).toBe(300)
    expect(totals.EUR).toBe(50)
  })
})
