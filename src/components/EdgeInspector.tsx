import React from 'react'
import {
  X,
  Trash2,
  ArrowRight,
  ArrowRightLeft,
  Percent,
  Hash,
  Sparkles,
} from 'lucide-react'
import {
  SimulationTransaction,
  SimulationNode,
  Currency,
} from '../types/simulation'
import { calculateTransitiveRate } from '../utils/currency'

interface EdgeInspectorProps {
  transaction: SimulationTransaction | null
  nodes: SimulationNode[]
  currencies: Currency[]
  onClose: () => void
  onUpdateTransaction: (updatedTx: SimulationTransaction) => void
  onDeleteTransaction: (txId: string) => void
}

export const EdgeInspector: React.FC<EdgeInspectorProps> = ({
  transaction,
  nodes,
  currencies,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  if (!transaction) return null

  const nodeMap = new Map<string, SimulationNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  const sourceNode = nodeMap.get(transaction.source)
  const targetNode = nodeMap.get(transaction.target)

  const handleActiveToggle = () => {
    onUpdateTransaction({ ...transaction, active: !transaction.active })
  }

  const handleSourceCurrencyChange = (sourceCurrencyId: string) => {
    onUpdateTransaction({ ...transaction, sourceCurrencyId })
  }

  const handleTargetCurrencyChange = (targetCurrencyId: string) => {
    onUpdateTransaction({ ...transaction, targetCurrencyId })
  }

  const handleExchangeRateChange = (exchangeRate: number) => {
    onUpdateTransaction({
      ...transaction,
      exchangeRate: Math.max(0.0001, exchangeRate),
    })
  }

  const handleAmountRuleTypeChange = (type: 'fixed' | 'percent_balance') => {
    const value = type === 'fixed' ? 50 : 10
    onUpdateTransaction({
      ...transaction,
      amountRule: { type, value },
    })
  }

  const handleAmountValueChange = (value: number) => {
    onUpdateTransaction({
      ...transaction,
      amountRule: { ...transaction.amountRule, value: Math.max(0, value) },
    })
  }

  const handleConditionTypeChange = (type: 'always' | 'min_balance') => {
    onUpdateTransaction({
      ...transaction,
      condition: {
        type,
        threshold: type === 'min_balance' ? 50 : undefined,
      },
    })
  }

  const handleThresholdChange = (threshold: number) => {
    onUpdateTransaction({
      ...transaction,
      condition: { ...transaction.condition, threshold: Math.max(0, threshold) },
    })
  }

  const isCrossCurrency = transaction.sourceCurrencyId !== transaction.targetCurrencyId

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRightLeft size={18} color="#38bdf8" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Transaction Inspector</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Source -> Target Route Indicator */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
            {sourceNode?.label || transaction.source}
          </div>
          <ArrowRight size={14} color="#38bdf8" />
          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
            {targetNode?.label || transaction.target}
          </div>
        </div>

        {/* Active Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Active in Simulation</span>
          <button
            onClick={handleActiveToggle}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: transaction.active ? '#10b98122' : '#64748b22',
              color: transaction.active ? '#34d399' : '#94a3b8',
            }}
          >
            {transaction.active ? 'Enabled' : 'Paused'}
          </button>
        </div>

        {/* Currency Pair & Exchange Rate */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Currency Transfer & Exchange
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '3px' }}>
                Sender Pays
              </span>
              <select
                value={transaction.sourceCurrencyId}
                onChange={(e) => handleSourceCurrencyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '3px' }}>
                Receiver Gets
              </span>
              <select
                value={transaction.targetCurrencyId}
                onChange={(e) => handleTargetCurrencyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exchange Rate Multiplier */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              border: isCrossCurrency ? '1px solid #38bdf8' : '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Exchange Multiplier</span>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={transaction.exchangeRate}
                onChange={(e) => handleExchangeRateChange(parseFloat(e.target.value) || 1)}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              1 {transaction.sourceCurrencyId} = {transaction.exchangeRate} {transaction.targetCurrencyId}
            </div>

            {/* Transitive relation card */}
            {isCrossCurrency && (() => {
              const triangulatedRate = calculateTransitiveRate(
                transaction.sourceCurrencyId,
                transaction.targetCurrencyId,
                currencies
              )
              const isPegged = Math.abs(transaction.exchangeRate - triangulatedRate) < 0.0001
              const sourceCur = currencies.find((c) => c.id === transaction.sourceCurrencyId)
              const targetCur = currencies.find((c) => c.id === transaction.targetCurrencyId)

              return (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} color="#10b981" />
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                        USD Transitive Pivot:
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: isPegged ? '#10b981' : '#f59e0b',
                        color: '#0f172a',
                        fontWeight: 700,
                      }}
                    >
                      {isPegged ? '✓ Matched USD Pivot' : 'Custom Markup'}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    1 {sourceCur?.symbol} (${sourceCur?.baseExchangeRate?.toFixed(2)} USD) ➔ 1 {targetCur?.symbol} (${targetCur?.baseExchangeRate?.toFixed(2)} USD) ={' '}
                    <span style={{ color: '#6ee7b7', fontWeight: 600 }}>
                      {triangulatedRate.toFixed(4)}
                    </span>
                  </div>

                  {!isPegged && (
                    <button
                      type="button"
                      onClick={() => handleExchangeRateChange(parseFloat(triangulatedRate.toFixed(4)))}
                      style={{
                        marginTop: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        color: '#10b981',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Sync to USD Transitive Rate ({triangulatedRate.toFixed(4)})
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Amount Transfer Rule */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Transfer Amount Rule
          </label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={() => handleAmountRuleTypeChange('fixed')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border:
                  transaction.amountRule.type === 'fixed'
                    ? '1px solid #38bdf8'
                    : '1px solid #334155',
                backgroundColor:
                  transaction.amountRule.type === 'fixed' ? '#38bdf822' : '#1e293b',
                color: transaction.amountRule.type === 'fixed' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <Hash size={12} />
              <span>Fixed</span>
            </button>
            <button
              onClick={() => handleAmountRuleTypeChange('percent_balance')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border:
                  transaction.amountRule.type === 'percent_balance'
                    ? '1px solid #38bdf8'
                    : '1px solid #334155',
                backgroundColor:
                  transaction.amountRule.type === 'percent_balance' ? '#38bdf822' : '#1e293b',
                color:
                  transaction.amountRule.type === 'percent_balance' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <Percent size={12} />
              <span>% Balance</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {transaction.amountRule.type === 'fixed' ? 'Units per tick' : 'Percentage (0 - 100%)'}
            </span>
            <input
              type="number"
              min="0"
              max={transaction.amountRule.type === 'percent_balance' ? 100 : undefined}
              step={transaction.amountRule.type === 'percent_balance' ? 1 : 5}
              value={transaction.amountRule.value}
              onChange={(e) => handleAmountValueChange(parseFloat(e.target.value) || 0)}
              style={{
                width: '80px',
                padding: '4px 8px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '12px',
                textAlign: 'right',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Condition Rule */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Execution Condition
          </label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={() => handleConditionTypeChange('always')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border:
                  transaction.condition.type === 'always'
                    ? '1px solid #38bdf8'
                    : '1px solid #334155',
                backgroundColor:
                  transaction.condition.type === 'always' ? '#38bdf822' : '#1e293b',
                color: transaction.condition.type === 'always' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Always
            </button>
            <button
              onClick={() => handleConditionTypeChange('min_balance')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border:
                  transaction.condition.type === 'min_balance'
                    ? '1px solid #38bdf8'
                    : '1px solid #334155',
                backgroundColor:
                  transaction.condition.type === 'min_balance' ? '#38bdf822' : '#1e293b',
                color: transaction.condition.type === 'min_balance' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Min Balance
            </button>
          </div>

          {transaction.condition.type === 'min_balance' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Minimum Balance Required</span>
              <input
                type="number"
                min="0"
                value={transaction.condition.threshold ?? 50}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value) || 0)}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          )}
        </div>

        {/* Delete Transaction */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => onDeleteTransaction(transaction.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              backgroundColor: '#7f1d1d22',
              color: '#f87171',
              border: '1px solid #7f1d1d',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} />
            <span>Delete Transaction</span>
          </button>
        </div>
      </div>
    </div>
  )
}
