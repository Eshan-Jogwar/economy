import { BaseTickStepNode } from './BaseTickStepNode'
import { TickExecutionContext } from './types'
import { TickSnapshot, SimulationState, SimulationNode } from '../../types/simulation'

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
 * Step Node 4: History & State Snapshot Handler
 * Responsible for:
 * - Calculating total supply across all nodes
 * - Creating a TickSnapshot containing total supply, tick volume, and execution events
 * - Updating rolling history (capped at 100 snapshots)
 * - Incrementing simulation tick clock
 * - Constructing the final `nextState`
 */
export class HistorySnapshotStepNode extends BaseTickStepNode {
  public handle(context: TickExecutionContext): void {
    const { initialState } = context
    const newTick = initialState.tick + 1

    const snapshot: TickSnapshot = {
      tick: newTick,
      totalBalances: calculateTotalSupply(context.nodes),
      totalVolume: context.totalVolume,
      events: context.events,
    }

    const updatedHistory = [...initialState.history, snapshot]
    const keptHistory =
      updatedHistory.length > 100
        ? updatedHistory.slice(updatedHistory.length - 100)
        : updatedHistory

    context.snapshot = snapshot
    context.nextState = {
      ...initialState,
      tick: newTick,
      nodes: context.nodes,
      history: keptHistory,
    }

    // Forward to any downstream node if attached
    this.forward(context)
  }
}
