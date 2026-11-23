import { ITickStepNode, TickExecutionContext } from './types'
import { NodeRulesStepNode } from './NodeRulesStepNode'
import { TransactionsStepNode } from './TransactionsStepNode'
import { VolumeMetricsStepNode } from './VolumeMetricsStepNode'
import { HistorySnapshotStepNode } from './HistorySnapshotStepNode'
import { SimulationState, TransactionExecutionEvent } from '../../types/simulation'

/**
 * Creates and links the default Chain of Responsibility for a simulation tick:
 * NodeRulesStepNode -> TransactionsStepNode -> VolumeMetricsStepNode -> HistorySnapshotStepNode
 */
export function createDefaultTickChain(): ITickStepNode {
  const nodeRulesStep = new NodeRulesStepNode()
  const transactionsStep = new TransactionsStepNode()
  const volumeMetricsStep = new VolumeMetricsStepNode()
  const historySnapshotStep = new HistorySnapshotStepNode()

  nodeRulesStep
    .setNext(transactionsStep)
    .setNext(volumeMetricsStep)
    .setNext(historySnapshotStep)

  return nodeRulesStep
}

/**
 * Runner / Orchestrator for executing a tick through the Chain of Responsibility.
 */
export class TickExecutionChain {
  private head: ITickStepNode

  constructor(customHead?: ITickStepNode) {
    this.head = customHead || createDefaultTickChain()
  }

  /**
   * Runs the chain for a given simulation state, returning the nextState and emitted events.
   */
  public execute(state: SimulationState): {
    nextState: SimulationState
    events: TransactionExecutionEvent[]
  } {
    const context: TickExecutionContext = {
      initialState: state,
      nodes: state.nodes.map((n) => ({ ...n, balances: { ...n.balances } })),
      events: [],
      totalVolume: {},
    }

    this.head.handle(context)

    if (!context.nextState) {
      throw new Error(
        'Chain of Responsibility did not produce a nextState. Ensure HistorySnapshotStepNode or equivalent final node is in the chain.'
      )
    }

    return {
      nextState: context.nextState,
      events: context.events,
    }
  }
}
