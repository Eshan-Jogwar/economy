import {
  SimulationState,
  SimulationNode,
  TransactionExecutionEvent,
  TickSnapshot,
} from '../../types/simulation'

/**
 * Context passed along the Chain of Responsibility during a single simulation tick.
 */
export interface TickExecutionContext {
  /** Initial read-only state of the simulation at start of tick */
  readonly initialState: SimulationState

  /** Current node state being updated by the step nodes */
  nodes: SimulationNode[]

  /** Transactions executed and events generated during this tick */
  events: TransactionExecutionEvent[]

  /** Aggregate volume moved during this tick per currency */
  totalVolume: Record<string, number>

  /** Generated snapshot for this tick */
  snapshot?: TickSnapshot

  /** Final resulting state after chain completion */
  nextState?: SimulationState
}

/**
 * Interface representing a step/node in the Chain of Responsibility.
 * Each node in the chain performs a specific function on the TickExecutionContext,
 * then forwards execution to the next node in the chain.
 */
export interface ITickStepNode {
  /**
   * Sets the next node in the chain.
   * Returns the next node to allow fluent chaining: nodeA.setNext(nodeB).setNext(nodeC)
   */
  setNext(next: ITickStepNode): ITickStepNode

  /**
   * Performs the specific responsibility of this node and forwards to the next node.
   */
  handle(context: TickExecutionContext): void
}
