import { BaseTickStepNode } from './BaseTickStepNode'
import { TickExecutionContext } from './types'

/**
 * Step Node 3: Volume Metrics Handler
 * Responsible for aggregating the volume moved per currency from all transactions executed during this tick.
 */
export class VolumeMetricsStepNode extends BaseTickStepNode {
  public handle(context: TickExecutionContext): void {
    const totalVolume: Record<string, number> = {}

    for (const event of context.events) {
      totalVolume[event.sourceCurrencyId] =
        (totalVolume[event.sourceCurrencyId] || 0) + event.sourceAmount
      if (event.targetCurrencyId !== event.sourceCurrencyId) {
        totalVolume[event.targetCurrencyId] =
          (totalVolume[event.targetCurrencyId] || 0) + event.targetAmount
      }
    }

    context.totalVolume = totalVolume

    // Forward updated context to the next step node in the chain
    this.forward(context)
  }
}
