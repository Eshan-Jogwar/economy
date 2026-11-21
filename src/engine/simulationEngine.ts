import {
  SimulationState,
  SimulationNode,
  TransactionExecutionEvent,
  TickSnapshot,
} from '../types/simulation'

/**
 * Calculates the total supply of each currency across all nodes.
 */
export function calculateTotalSupply(nodes: SimulationNode[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const node of nodes) {
    for (const [currencyId, amount] of Object.entries(node.balances)) {
      totals[currencyId] = (totals[currencyId] || 0) + amount
    }
  }
  return totals
}

/**
 * Calculates the velocity of a currency over a given history of tick snapshots.
 * Velocity = total volume moved / average total supply over the period.
 */
export function calculateVelocity(
  history: TickSnapshot[],
  currencyId: string
): number {
  if (history.length === 0) return 0

  let totalVolume = 0
  for (const snapshot of history) {
    totalVolume += (snapshot.totalVolume[currencyId] || 0)
  }

  // Average total supply across all snapshots
  let totalSupplySum = 0
  for (const snapshot of history) {
    totalSupplySum += (snapshot.totalBalances[currencyId] || 0)
  }
  const averageSupply = totalSupplySum / history.length

  if (averageSupply === 0) return 0
  return totalVolume / averageSupply
}

/**
 * Executes one tick of the simulation:
 * - Applies node rules (mint/drain)
 * - Evaluates and executes transactions
 * - Updates tick and history
 */
export function executeTick(state: SimulationState): {
  nextState: SimulationState
  events: TransactionExecutionEvent[]
} {
  // Step 1: Apply node rules (mint/drain) first - create initial balance copies
  let nodeBalances: Record<string, Record<string, number>> = {}
  let updatedNodes: SimulationNode[] = state.nodes.map((node) => {
    const baseBalances: Record<string, number> = { ...node.balances }
    nodeBalances[node.id] = baseBalances

    if (node.rule?.type === 'mint') {
      // Mint adds to the specified currency balance
      baseBalances[node.rule.currencyId] = (baseBalances[node.rule.currencyId] || 0) + node.rule.amount
    } else if (node.rule?.type === 'drain') {
      // Drain subtracts from the specified currency balance (not below 0)
      if ((baseBalances[node.rule.currencyId] || 0) >= node.rule.amount) {
        baseBalances[node.rule.currencyId] = baseBalances[node.rule.currencyId]! - node.rule.amount
      }
    }

    return {
      ...node,
      balances: baseBalances,
    }
  })

  // Step 2: Evaluate and execute transactions
  let events: TransactionExecutionEvent[] = []

  for (const tx of state.transactions) {
    // Check if transaction is active
    if (!tx.active) continue

    // Find source and target nodes
    const sourceNode = updatedNodes.find((n) => n.id === tx.source)
    const targetNode = updatedNodes.find((n) => n.id === tx.target)

    if (!sourceNode || !targetNode) continue

    // Check condition
    if (tx.condition.type === 'min_balance') {
      const sourceBalance = sourceNode.balances[tx.sourceCurrencyId] || 0
      if (sourceBalance < (tx.condition.threshold || 0)) continue
    }
    // 'always' condition: always execute if active and nodes exist

    // Compute transfer amount based on amount rule
    let transferAmount: number
    if (tx.amountRule.type === 'fixed') {
      transferAmount = tx.amountRule.value
    } else if (tx.amountRule.type === 'percent_balance') {
      const sourceBalance = sourceNode.balances[tx.sourceCurrencyId] || 0
      transferAmount = sourceBalance * (tx.amountRule.value / 100)
    } else {
      continue
    }

    // Cap transfer at available balance and ensure positive
    const availableBalance = sourceNode.balances[tx.sourceCurrencyId] || 0
    if (transferAmount <= 0 || transferAmount > availableBalance) continue

    // Compute source and target amounts
    const sourceAmount = transferAmount
    const targetAmount = transferAmount * tx.exchangeRate

    // Update source node balance
    const newSourceBalances: Record<string, number> = { ...sourceNode.balances }
    newSourceBalances[tx.sourceCurrencyId] = availableBalance - sourceAmount

    // Update target node balance
    const newTargetBalances: Record<string, number> = { ...targetNode.balances }
    newTargetBalances[tx.targetCurrencyId] = (newTargetBalances[tx.targetCurrencyId] || 0) + targetAmount

    // Apply updated balances to nodes
    updatedNodes = updatedNodes.map((n) => {
      if (n.id === sourceNode.id) {
        return { ...n, balances: newSourceBalances }
      }
      if (n.id === targetNode.id) {
        return { ...n, balances: newTargetBalances }
      }
      return n
    })

    // Create execution event
    const event: TransactionExecutionEvent = {
      id: `event-${tx.id}-${state.tick}`,
      tick: state.tick,
      transactionId: tx.id,
      sourceNodeId: tx.source,
      targetNodeId: tx.target,
      sourceAmount: sourceAmount,
      sourceCurrencyId: tx.sourceCurrencyId,
      targetAmount: targetAmount,
      targetCurrencyId: tx.targetCurrencyId,
      exchangeRate: tx.exchangeRate,
      timestamp: Date.now(),
    }
    events.push(event)
  }

  // Step 3: Compute volume per currency from executed events
  const totalVolume: Record<string, number> = {}
  for (const event of events) {
    totalVolume[event.sourceCurrencyId] = (totalVolume[event.sourceCurrencyId] || 0) + event.sourceAmount
    if (event.targetCurrencyId !== event.sourceCurrencyId) {
      totalVolume[event.targetCurrencyId] = (totalVolume[event.targetCurrencyId] || 0) + event.targetAmount
    }
  }

  // Step 4: Update tick and history
  const newTick = state.tick + 1
  const snapshot: TickSnapshot = {
    tick: newTick,
    totalBalances: calculateTotalSupply(updatedNodes),
    totalVolume,
    events,
  }

  // Keep at most 100 recent snapshots
  const updatedHistory = [...state.history, snapshot]
  const keptHistory = updatedHistory.length > 100
    ? updatedHistory.slice(updatedHistory.length - 100)
    : updatedHistory

  const nextState: SimulationState = {
    ...state,
    tick: newTick,
    nodes: updatedNodes,
    history: keptHistory,
  }

  return { nextState, events }
}