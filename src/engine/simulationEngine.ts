import {
  SimulationState,
  SimulationNode,
  TransactionExecutionEvent,
  TickSnapshot,
} from '../types/simulation'
import {
  TickExecutionChain,
  createDefaultTickChain,
} from './chain/TickExecutionChain'
import { calculateTotalSupply } from './chain/HistorySnapshotStepNode'

// Export Chain of Responsibility elements for extensibility
export * from './chain/types'
export * from './chain/BaseTickStepNode'
export * from './chain/NodeRulesStepNode'
export * from './chain/TransactionsStepNode'
export * from './chain/VolumeMetricsStepNode'
export * from './chain/HistorySnapshotStepNode'
export * from './chain/TickExecutionChain'

/**
 * Default singleton instance of the tick execution chain.
 */
const defaultChain = new TickExecutionChain()

/**
 * Re-export calculateTotalSupply for backwards compatibility and metrics.
 */
export { calculateTotalSupply }

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
    totalVolume += snapshot.totalVolume[currencyId] || 0
  }

  // Average total supply across all snapshots
  let totalSupplySum = 0
  for (const snapshot of history) {
    totalSupplySum += snapshot.totalBalances[currencyId] || 0
  }
  const averageSupply = totalSupplySum / history.length

  if (averageSupply === 0) return 0
  return totalVolume / averageSupply
}

/**
 * Executes one tick of the simulation using the Chain of Responsibility design pattern:
 * Step 1: NodeRulesStepNode applies node rules (mint/drain)
 * Step 2: TransactionsStepNode evaluates conditions, converts currency, and transfers balances
 * Step 3: VolumeMetricsStepNode aggregates currency volume
 * Step 4: HistorySnapshotStepNode computes supply, constructs snapshots, updates history, and increments tick
 */
export function executeTick(state: SimulationState): {
  nextState: SimulationState
  events: TransactionExecutionEvent[]
} {
  return defaultChain.execute(state)
}
