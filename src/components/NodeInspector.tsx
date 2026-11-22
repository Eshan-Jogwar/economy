import React, { useState } from 'react'
import {
  X,
  Trash2,
  CircleDot,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  Slash,
  DollarSign,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react'
import { SimulationNode, Currency } from '../types/simulation'
import {
  getNodeCurrencyId,
  getNodeBalance,
  getNodeUsdValue,
  getUnitsPerDollar,
  getBaseExchangeRate,
  convertFromUsd,
  convertToUsd,
  DEFAULT_BASE_CURRENCY,
} from '../utils/currency'

interface NodeInspectorProps {
  node: SimulationNode | null
  currencies: Currency[]
  onClose: () => void
  onUpdateNode: (updatedNode: SimulationNode) => void
  onDeleteNode: (nodeId: string) => void
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  currencies,
  onClose,
  onUpdateNode,
  onDeleteNode,
}) => {
  if (!node) return null

  const activeCurId = getNodeCurrencyId(node, currencies)
  const activeCur =
    currencies.find((c) => c.id === activeCurId) ||
    currencies[0] ||
    DEFAULT_BASE_CURRENCY

  const nativeBalance = getNodeBalance(node, activeCurId, currencies)
  const usdValue = getNodeUsdValue(node, currencies)
  const factorX = getUnitsPerDollar(activeCur)
  const rateInUsd = getBaseExchangeRate(activeCur)

  const handleLabelChange = (label: string) => {
    onUpdateNode({ ...node, label })
  }

  // Change currency wrapper (cover) for this node
  const handleCurrencyWrapperChange = (newCurId: string) => {
    // Preserve exact USD value when changing currency wrapper
    const currentUsd = getNodeUsdValue(node, currencies)
    const convertedAmount = convertFromUsd(currentUsd, newCurId, currencies)

    onUpdateNode({
      ...node,
      currencyId: newCurId,
      balances: {
        [newCurId]: convertedAmount,
      },
    })
  }

  // Handle balance change in node's native currency
  const handleNativeBalanceChange = (newAmount: number) => {
    const validAmount = Math.max(0, newAmount)
    onUpdateNode({
      ...node,
      currencyId: activeCurId,
      balances: {
        [activeCurId]: validAmount,
      },
    })
  }

  // Handle balance change in USD
  const handleUsdValueChange = (newUsd: number) => {
    const validUsd = Math.max(0, newUsd)
    const localAmount = convertFromUsd(validUsd, activeCurId, currencies)
    onUpdateNode({
      ...node,
      currencyId: activeCurId,
      balances: {
        [activeCurId]: localAmount,
      },
    })
  }

  const handleRuleTypeChange = (type: 'none' | 'mint' | 'drain') => {
    if (type === 'none') {
      onUpdateNode({ ...node, rule: undefined })
    } else {
      const defaultCurrencyId = node.rule?.currencyId || activeCurId
      const amount = node.rule?.amount || 25
      onUpdateNode({
        ...node,
        rule: { type, currencyId: defaultCurrencyId, amount },
      })
    }
  }

  const handleRuleAmountChange = (amount: number) => {
    if (!node.rule || node.rule.type === 'none') return
    onUpdateNode({
      ...node,
      rule: { ...node.rule, amount: Math.max(0, amount) },
    })
  }

  const handleRuleCurrencyChange = (currencyId: string) => {
    if (!node.rule || node.rule.type === 'none') return
    onUpdateNode({
      ...node,
      rule: { ...node.rule, currencyId },
    })
  }

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
          <CircleDot size={18} color="#38bdf8" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Node Inspector</span>
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
        {/* Label */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Node Label
          </label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Currency Wrapper / Cover */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              Currency Wrapper (Cover)
            </label>
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>
              Labels money value
            </span>
          </div>

          <select
            value={activeCurId}
            onChange={(e) => handleCurrencyWrapperChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: `1px solid ${activeCur.color}`,
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol}) — {c.id} (x = {getUnitsPerDollar(c)})
              </option>
            ))}
          </select>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
            Formula: {activeCur.symbol} * {factorX.toFixed(2)} = $1.00 USD (1 {activeCur.symbol} = ${rateInUsd.toFixed(4)} USD)
          </div>
        </div>

        {/* Unified Money Balance Card */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Unified Money Balance
          </div>

          {/* In Local Currency Wrapper */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: activeCur.color, fontWeight: 600 }}>
                In {activeCur.name} ({activeCur.symbol})
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                Wrapper Unit
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: activeCur.color, fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>
                {activeCur.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={nativeBalance}
                onChange={(e) => handleNativeBalanceChange(parseFloat(e.target.value) || 0)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* In US Dollar Standard */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                Equivalent in US Dollar ($ USD)
              </span>
              <span style={{ fontSize: '10px', color: '#10b981', fontFamily: 'monospace' }}>
                Underlying Value
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>
                $
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={parseFloat(usdValue.toFixed(2))}
                onChange={(e) => handleUsdValueChange(parseFloat(e.target.value) || 0)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '4px',
                  color: '#10b981',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>
        </div>

        {/* View in Other Currencies Breakdown */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              View Value in Other Currencies
            </label>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              Cover preview
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#070c18',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {currencies.map((c) => {
              const amountInCur = convertFromUsd(usdValue, c.id, currencies)
              const isCurrent = c.id === activeCurId
              const decimals = c.decimals ?? 2

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                      }}
                    />
                    <span style={{ color: isCurrent ? '#38bdf8' : '#94a3b8', fontWeight: isCurrent ? 600 : 400 }}>
                      {c.name} ({c.symbol})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: c.color }}>
                      {amountInCur.toLocaleString(undefined, {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals,
                      })}{' '}
                      {c.symbol}
                    </span>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleCurrencyWrapperChange(c.id)}
                        title={`Wrap node in ${c.name}`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          fontSize: '10px',
                        }}
                      >
                        <ArrowRightLeft size={11} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Autonomous Tick Rule */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Autonomous Rule (Per Tick)
          </label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {[
              { type: 'none' as const, label: 'None', icon: Slash },
              { type: 'mint' as const, label: 'Mint (Supply)', icon: PlusCircle },
              { type: 'drain' as const, label: 'Drain (Burn)', icon: MinusCircle },
            ].map((btn) => {
              const isSelected = (node.rule?.type || 'none') === btn.type
              return (
                <button
                  key={btn.type}
                  onClick={() => handleRuleTypeChange(btn.type)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                    backgroundColor: isSelected ? '#38bdf822' : '#1e293b',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {btn.label}
                </button>
              )
            })}
          </div>

          {node.rule && node.rule.type !== 'none' && (
            <div
              style={{
                padding: '10px',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Target Currency</span>
                <select
                  value={node.rule.currencyId}
                  onChange={(e) => handleRuleCurrencyChange(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                  }}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Amount per Tick</span>
                <input
                  type="number"
                  min="1"
                  value={node.rule.amount}
                  onChange={(e) => handleRuleAmountChange(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '80px',
                    padding: '4px 8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Delete Node */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => onDeleteNode(node.id)}
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
            <span>Delete Node</span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default NodeInspector
