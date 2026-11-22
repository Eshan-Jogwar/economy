import React, { useState, useEffect } from 'react'
import {
  X,
  CircleDot,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  MapPin,
} from 'lucide-react'
import { NodeRule, SimulationNode, Currency, NodeRole } from '../types/simulation'
import {
  convertToUsd,
  DEFAULT_BASE_CURRENCY,
} from '../utils/currency'

interface CreateNodeModalProps {
  isOpen: boolean
  initialRole?: NodeRole
  canvasPosition: { x: number; y: number }
  currencies: Currency[]
  existingNodeCount: number
  onConfirm: (nodeData: Omit<SimulationNode, 'id'>) => void
  onCancel: () => void
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  canvasPosition,
  currencies,
  existingNodeCount,
  onConfirm,
  onCancel,
}) => {
  const [label, setLabel] = useState<string>('')
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('USD')
  const [startingBalance, setStartingBalance] = useState<number>(100)
  const [ruleType, setRuleType] = useState<'none' | 'mint' | 'drain'>('none')
  const [ruleCurrencyId, setRuleCurrencyId] = useState<string>('')
  const [ruleAmount, setRuleAmount] = useState<number>(10)

  // Sync state whenever modal opens
  useEffect(() => {
    if (!isOpen) return
    setLabel(`Node ${existingNodeCount + 1}`)

    const defaultCurId = currencies[0]?.id || 'USD'
    setSelectedCurrencyId(defaultCurId)
    setStartingBalance(100)

    setRuleType('none')
    setRuleCurrencyId(defaultCurId)
    setRuleAmount(10)
  }, [isOpen, existingNodeCount, currencies])

  const activeCur =
    currencies.find((c) => c.id === selectedCurrencyId) ||
    currencies[0] ||
    DEFAULT_BASE_CURRENCY

  const startingUsdValue = convertToUsd(startingBalance, selectedCurrencyId, currencies)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedLabel = label.trim() || `Node ${existingNodeCount + 1}`

    let rule: NodeRule | undefined = undefined
    if (ruleType !== 'none') {
      rule = {
        type: ruleType,
        currencyId: ruleCurrencyId || selectedCurrencyId,
        amount: Math.max(0, ruleAmount),
      }
    }

    onConfirm({
      label: trimmedLabel,
      role: 'node',
      position: canvasPosition,
      currencyId: selectedCurrencyId,
      balances: {
        [selectedCurrencyId]: Math.max(0, startingBalance),
      },
      rule,
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          onCancel()
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <div
        className="modal-container"
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0b1120',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <CircleDot size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Create Simulation Node
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                <MapPin size={11} />
                <span>
                  Position: ({Math.round(canvasPosition.x)}, {Math.round(canvasPosition.y)})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {/* Node Label */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="create-node-label"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Node Label / Name
            </label>
            <input
              id="create-node-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Node 1"
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Unified Starting Balance & Currency Wrapper */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Initial Money Balance & Currency
              </label>
              <span style={{ fontSize: '10px', color: '#10b981' }}>
                Single unified value (not split)
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#090d16',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                {/* Currency Wrapper Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                    Currency Wrapper
                  </label>
                  <select
                    value={selectedCurrencyId}
                    onChange={(e) => setSelectedCurrencyId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#1e293b',
                      border: `1px solid ${activeCur.color}`,
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr.id} value={curr.id}>
                        {curr.name} ({curr.symbol}) — {curr.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starting Balance Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                    Starting Balance ({activeCur.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: activeCur.color,
                      fontWeight: 600,
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Conversion Insight */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: '#0f172a',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#94a3b8' }}>
                  Equivalent in US Dollar Value:
                </span>
                <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
                  ${startingUsdValue.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous Behavior / Rule */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Autonomous Behavior (Tick Rule)
              </label>
            </div>

            <div
              style={{
                backgroundColor: '#090d16',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { type: 'none' as const, label: 'None', icon: HelpCircle },
                  { type: 'mint' as const, label: 'Mint (Supply)', icon: PlusCircle },
                  { type: 'drain' as const, label: 'Drain (Sink)', icon: MinusCircle },
                ].map((btn) => {
                  const isSelected = ruleType === btn.type
                  return (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setRuleType(btn.type)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
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

              {ruleType !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Rule Currency
                    </label>
                    <select
                      value={ruleCurrencyId}
                      onChange={(e) => setRuleCurrencyId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
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

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Amount / Tick
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={ruleAmount}
                      onChange={(e) => setRuleAmount(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid #1e293b',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                backgroundColor: '#38bdf8',
                border: 'none',
                borderRadius: '6px',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
              }}
            >
              Create Node
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CreateNodeModal
