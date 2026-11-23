import { BaseTickStepNode } from './BaseTickStepNode'
import { TickExecutionContext } from './types'
import { SimulationNode } from '../../types/simulation'

/**
 * Step Node 1: Node Rules Handler
 * Responsible for applying node-specific rules (minting new currency or draining existing currency).
 */
export class NodeRulesStepNode extends BaseTickStepNode {
  public handle(context: TickExecutionContext): void {
    context.nodes = context.nodes.map((node: SimulationNode) => {
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

    // Forward updated context to the next step node in the chain
    this.forward(context)
  }
}
