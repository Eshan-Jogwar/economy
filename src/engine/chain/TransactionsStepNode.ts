import { BaseTickStepNode } from './BaseTickStepNode'
import { TickExecutionContext } from './types'
import { TransactionExecutionEvent } from '../../types/simulation'
import { convertCurrency } from '../../utils/currency'

/**
 * Step Node 2: Transactions Execution Handler
 * Responsible for evaluating active transactions across the graph edges:
 * - Checks condition rules (e.g. min_balance)
 * - Calculates transfer amounts (fixed or percent_balance)
 * - Converts source currency to target currency using exchange rates
 * - Transfers balances between source and target nodes
 * - Emits TransactionExecutionEvent records
 */
export class TransactionsStepNode extends BaseTickStepNode {
  public handle(context: TickExecutionContext): void {
    const { initialState } = context
    const events: TransactionExecutionEvent[] = []

    for (const tx of initialState.transactions) {
      if (!tx.active) continue

      const sourceNode = context.nodes.find((n) => n.id === tx.source)
      const targetNode = context.nodes.find((n) => n.id === tx.target)

      if (!sourceNode || !targetNode) continue

      const sourcePrimaryCur =
        sourceNode.currencyId || Object.keys(sourceNode.balances)[0] || 'USD'
      const targetPrimaryCur =
        targetNode.currencyId || Object.keys(targetNode.balances)[0] || 'USD'
      const sourceCurId = tx.sourceCurrencyId || sourcePrimaryCur
      const targetCurId = tx.targetCurrencyId || targetPrimaryCur

      // Available balance in sourceCurId
      let availableBalance = sourceNode.balances[sourceCurId] ?? 0
      if (
        availableBalance === 0 &&
        sourcePrimaryCur !== sourceCurId &&
        (sourceNode.balances[sourcePrimaryCur] ?? 0) > 0
      ) {
        availableBalance = convertCurrency(
          sourceNode.balances[sourcePrimaryCur],
          sourcePrimaryCur,
          sourceCurId,
          initialState.currencies
        )
      }

      // Check condition
      if (tx.condition.type === 'min_balance') {
        if (availableBalance < (tx.condition.threshold || 0)) continue
      }

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
        newSourceBalances[sourceCurId] = Math.max(
          0,
          newSourceBalances[sourceCurId] - sourceAmount
        )
      } else if (newSourceBalances[sourcePrimaryCur] !== undefined) {
        const deductionInPrimary = convertCurrency(
          sourceAmount,
          sourceCurId,
          sourcePrimaryCur,
          initialState.currencies
        )
        newSourceBalances[sourcePrimaryCur] = Math.max(
          0,
          newSourceBalances[sourcePrimaryCur] - deductionInPrimary
        )
      }

      // Update target node balance:
      // Money is unified under target's currency wrapper (not split into multiple currencies)
      const newTargetBalances: Record<string, number> = { ...targetNode.balances }
      if (
        targetCurId === targetPrimaryCur ||
        Object.keys(newTargetBalances).length <= 1
      ) {
        const additionInPrimary =
          targetCurId === targetPrimaryCur
            ? targetAmount
            : convertCurrency(
                targetAmount,
                targetCurId,
                targetPrimaryCur,
                initialState.currencies
              )
        newTargetBalances[targetPrimaryCur] =
          (newTargetBalances[targetPrimaryCur] || 0) + additionInPrimary
      } else {
        newTargetBalances[targetCurId] =
          (newTargetBalances[targetCurId] || 0) + targetAmount
      }

      // Apply updated balances to nodes
      context.nodes = context.nodes.map((n) => {
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
        id: `event-${tx.id}-${initialState.tick}`,
        tick: initialState.tick,
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

    context.events = events

    // Forward updated context to the next step node in the chain
    this.forward(context)
  }
}
