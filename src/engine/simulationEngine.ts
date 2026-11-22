import {
  SimulationState,
  SimulationNode,
  TransactionExecutionEvent,
  TickSnapshot,
} from '../types/simulation'
import { convertCurrency } from '../utils/currency'

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
 * - Keeps node holdings unified under its currency wrapper without splitting
 * - Updates tick and history
 */
export function executeTick(state: SimulationState): {
  nextState: SimulationState
  events: TransactionExecutionEvent[]
} {
  // Step 1: Apply node rules (mint/drain) first - create initial balance copies
  let updatedNodes: SimulationNode[] = state.nodes.map((node) => {
    const baseBalances: Record<string, number> = { ...node.balances }
    const nodeCurId = node.currencyId || Object.keys(baseBalances)[0] || 'USD'

    if (node.rule?.type === 'mint') {
      const curId = node.rule.currencyId || nodeCurId
      baseBalances[curId] = (baseBalances[curId] || 0) + node.rule.amount
    } else if (node.rule?.type === 'drain') {
      const curId = node.rule.currencyId || nodeCurId
      if ((baseBalances[curId] || 0) >= node.rule.amount) {
        baseBalances[curId] = (baseBalances[curId] || 0) - node.rule.amount
      }
    }

    return {
      ...node,
      currencyId: nodeCurId,
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

    const sourcePrimaryCur = sourceNode.currencyId || Object.keys(sourceNode.balances)[0] || 'USD'
    const targetPrimaryCur = targetNode.currencyId || Object.keys(targetNode.balances)[0] || 'USD'
    const sourceCurId = tx.sourceCurrencyId || sourcePrimaryCur
    const targetCurId = tx.targetCurrencyId || targetPrimaryCur

    // Available balance in sourceCurId
    let availableBalance = sourceNode.balances[sourceCurId] ?? 0
    if (availableBalance === 0 && sourcePrimaryCur !== sourceCurId && (sourceNode.balances[sourcePrimaryCur] ?? 0) > 0) {
      availableBalance = convertCurrency(
        sourceNode.balances[sourcePrimaryCur],
        sourcePrimaryCur,
        sourceCurId,
        state.currencies
      )
    }

    // Check condition
    if (tx.condition.type === 'min_balance') {
      if (availableBalance < (tx.condition.threshold || 0)) continue
    }
    // 'always' condition: always execute if active and nodes exist

    // Compute transfer amount based on amount rule
    let transferAmount: number
    if (tx.amountRule.type === 'fixed') {
      transferAmount = tx.amountRule.value
    } else if (tx.amountRule.type === 'percent_balance') {
      transferAmount = availableBalance * (tx.amountRule.value / 100)
    } else {
      continue
    }

    // Cap transfer at available balance and ensure positive
    if (transferAmount <= 0 || transferAmount > availableBalance) continue

    // Compute source and target amounts
    const sourceAmount = transferAmount
    const targetAmount = transferAmount * tx.exchangeRate

    // Update source node balance
    const newSourceBalances: Record<string, number> = { ...sourceNode.balances }
    if (newSourceBalances[sourceCurId] !== undefined) {
      newSourceBalances[sourceCurId] = Math.max(0, newSourceBalances[sourceCurId] - sourceAmount)
    } else if (newSourceBalances[sourcePrimaryCur] !== undefined) {
      const deductionInPrimary = convertCurrency(
        sourceAmount,
        sourceCurId,
        sourcePrimaryCur,
        state.currencies
      )
      newSourceBalances[sourcePrimaryCur] = Math.max(0, newSourceBalances[sourcePrimaryCur] - deductionInPrimary)
    }

    // Update target node balance:
    // Money is unified under target's currency wrapper (not split into multiple currencies)
    const newTargetBalances: Record<string, number> = { ...targetNode.balances }
    if (targetCurId === targetPrimaryCur || Object.keys(newTargetBalances).length <= 1) {
      const additionInPrimary = targetCurId === targetPrimaryCur
        ? targetAmount
        : convertCurrency(targetAmount, targetCurId, targetPrimaryCur, state.currencies)
      newTargetBalances[targetPrimaryCur] = (newTargetBalances[targetPrimaryCur] || 0) + additionInPrimary
    } else {
      newTargetBalances[targetCurId] = (newTargetBalances[targetCurId] || 0) + targetAmount
    }

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
      sourceCurrencyId: sourceCurId,
      targetAmount: targetAmount,
      targetCurrencyId: targetCurId,
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
