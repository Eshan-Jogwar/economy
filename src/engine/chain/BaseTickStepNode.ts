import { ITickStepNode, TickExecutionContext } from './types'

/**
 * Base abstract class for a step node in the Chain of Responsibility.
 * Handles link maintenance and forwarding to the next node in the chain.
 */
export abstract class BaseTickStepNode implements ITickStepNode {
  protected nextNode: ITickStepNode | null = null

  public setNext(next: ITickStepNode): ITickStepNode {
    this.nextNode = next
    return next
  }

  /**
   * Subclasses implement their specific step responsibility here.
   * After completing their work, they should call `this.forward(context)`.
   */
  public abstract handle(context: TickExecutionContext): void

  /**
   * Forwards execution to the next node in the chain, if one exists.
   */
  protected forward(context: TickExecutionContext): void {
    if (this.nextNode) {
      this.nextNode.handle(context)
    }
  }
}
