import React, { useState, useEffect } from 'react'
import {
  X,
  ArrowRight,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import {
  SimulationNode,
  Currency,
  TransactionAmountRule,
  TransactionCondition,
} from '../types/simulation'
import { calculateTransitiveRate } from '../utils/currency'

interface CreateEdgeModalProps {
  isOpen: boolean
  sourceNode: SimulationNode | null
  targetNode: SimulationNode | null
  currencies: Currency[]
  onConfirm: (txData: {
    sourceCurrencyId: string
    targetCurrencyId: string
    exchangeRate: number
    amountRule: TransactionAmountRule
    condition: TransactionCondition
    active: boolean
    label?: string
  }) => void
  onCancel: () => void
}

export const CreateEdgeModal: React.FC<CreateEdgeModalProps> = ({
  isOpen,
  sourceNode,
  targetNode,
  currencies,
  onConfirm,
  onCancel,
}) => {
  const [sourceCurrencyId, setSourceCurrencyId] = useState<string>('')
  const [targetCurrencyId, setTargetCurrencyId] = useState<string>('')
  const [exchangeRate, setExchangeRate] = useState<number>(1.0)
  const [amountRuleType, setAmountRuleType] = useState<'fixed' | 'percent_balance'>('fixed')
  const [amountValue, setAmountValue] = useState<number>(25)
  const [conditionType, setConditionType] = useState<'always' | 'min_balance'>('always')
  const [threshold, setThreshold] = useState<number>(50)
  const [active, setActive] = useState<boolean>(true)
  const [label, setLabel] = useState<string>('')

  // Reset/initialize fields when modal opens
  useEffect(() => {
    if (!isOpen || !sourceNode || !targetNode) return

    // Pick top currency held by source node if possible, else first currency
    const sourceCurrenciesWithBalance = Object.keys(sourceNode.balances).filter(
      (c) => (sourceNode.balances[c] ?? 0) > 0
    )
    const defaultSourceCur = sourceCurrenciesWithBalance[0] || currencies[0]?.id || 'CRD'
    const defaultTargetCur = defaultSourceCur

    setSourceCurrencyId(defaultSourceCur)
    setTargetCurrencyId(defaultTargetCur)
    setExchangeRate(1.0)
    setAmountRuleType('fixed')
    setAmountValue(25)
    setConditionType('always')
    setThreshold(50)
    setActive(true)
    setLabel(`Transfer: ${sourceNode.label} → ${targetNode.label}`)
  }, [isOpen, sourceNode, targetNode, currencies])

  if (!isOpen || !sourceNode || !targetNode) return null

  const sourceCurrency = currencies.find((c) => c.id === sourceCurrencyId)
  const targetCurrency = currencies.find((c) => c.id === targetCurrencyId)
  const isFxConversion = sourceCurrencyId !== targetCurrencyId

  const triangulatedRate = calculateTransitiveRate(sourceCurrencyId, targetCurrencyId, currencies)
  const isPeggedToUSD = Math.abs(exchangeRate - triangulatedRate) < 0.0001

  const handleSourceCurrencyChange = (newSrc: string) => {
    setSourceCurrencyId(newSrc)
    const newRate = calculateTransitiveRate(newSrc, targetCurrencyId, currencies)
    setExchangeRate(parseFloat(newRate.toFixed(4)))
  }

  const handleTargetCurrencyChange = (newTgt: string) => {
    setTargetCurrencyId(newTgt)
    const newRate = calculateTransitiveRate(sourceCurrencyId, newTgt, currencies)
    setExchangeRate(parseFloat(newRate.toFixed(4)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onConfirm({
      sourceCurrencyId: sourceCurrencyId || (currencies[0]?.id ?? 'CRD'),
      targetCurrencyId: targetCurrencyId || (currencies[0]?.id ?? 'CRD'),
      exchangeRate: Math.max(0.0001, exchangeRate || 1.0),
      amountRule: {
        type: amountRuleType,
        value: Math.max(0, amountValue || 0),
      },
      condition: {
        type: conditionType,
        threshold: conditionType === 'min_balance' ? Math.max(0, threshold || 0) : undefined,
      },
      active,
      label: label.trim() || undefined,
    })
  }

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
      onClick={onCancel}
    >
      <div
        className="modal-container"
        style={{
          width: '100%',
          maxWidth: '540px',
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
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1e293b',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Create Transaction Route</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Configure flow rate, currency exchange, and triggers
            </div>
          </div>
          <button
            onClick={onCancel}
            title="Cancel (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Source -> Target Connection Banner */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#090d16',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Source Node Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: '9px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
              }}
            >
              Source Node (Sender)
            </span>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#38bdf8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sourceNode.label}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
            }}
          >
            <ArrowRight size={16} />
          </div>

          {/* Target Node Info */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <span
              style={{
                fontSize: '9px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
              }}
            >
              Target Node (Receiver)
            </span>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#a78bfa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {targetNode.label}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px' }}>
          {/* Currencies & Exchange Rate Section */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Currencies & Conversion
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '10px',
                alignItems: 'center',
                backgroundColor: '#090d16',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div>
                <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Source Pays
                </label>
                <select
                  value={sourceCurrencyId}
                  onChange={(e) => handleSourceCurrencyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: sourceCurrency?.color || '#f8fafc',
                    fontWeight: 600,
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol || c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ paddingTop: '16px', color: '#64748b' }}>
                <ArrowRight size={14} />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Target Receives
                </label>
                <select
                  value={targetCurrencyId}
                  onChange={(e) => handleTargetCurrencyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: targetCurrency?.color || '#f8fafc',
                    fontWeight: 600,
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol || c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transitive FX Derivation Card via Dollar */}
            {isFxConversion && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={12} color="#10b981" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981' }}>
                      Transitive Pivot via Dollar ($ USD)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: isPeggedToUSD ? '#10b981' : '#f59e0b',
                      color: '#0f172a',
                    }}
                  >
                    {isPeggedToUSD ? '✓ Pegged to USD Pivot' : 'Custom Spread'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  1 {sourceCurrency?.symbol} (${sourceCurrency?.baseExchangeRate?.toFixed(2)} USD) ➔{' '}
                  1 {targetCurrency?.symbol} (${targetCurrency?.baseExchangeRate?.toFixed(2)} USD)
                  {' = '}
                  <span style={{ color: '#6ee7b7', fontWeight: 600 }}>
                    {triangulatedRate.toFixed(4)} {targetCurrency?.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Exchange Rate Multiplier (shows if differing currencies or customized) */}
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: isFxConversion ? 'rgba(167, 139, 250, 0.1)' : '#090d16',
                borderRadius: '6px',
                border: isFxConversion ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color={isFxConversion ? '#a78bfa' : '#64748b'} />
                <span style={{ fontSize: '11px', color: '#f8fafc' }}>
                  Exchange Rate (1 {sourceCurrency?.symbol || sourceCurrencyId} = X{' '}
                  {targetCurrency?.symbol || targetCurrencyId})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1.0)}
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                {isFxConversion && !isPeggedToUSD && (
                  <button
                    type="button"
                    onClick={() => setExchangeRate(parseFloat(triangulatedRate.toFixed(4)))}
                    title="Reset to exact USD transitive rate"
                    style={{
                      padding: '3px 6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #10b981',
                      borderRadius: '4px',
                      color: '#10b981',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reset to USD Rate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Amount Rule Section */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Transfer Sizing Rule
            </label>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAmountRuleType('fixed')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: amountRuleType === 'fixed' ? '#334155' : 'transparent',
                    border: amountRuleType === 'fixed' ? '1px solid #38bdf8' : '1px solid #1e293b',
                    color: amountRuleType === 'fixed' ? '#f8fafc' : '#64748b',
                    fontSize: '11px',
                    fontWeight: amountRuleType === 'fixed' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Sliders size={13} />
                  Fixed Amount per Tick
                </button>
                <button
                  type="button"
                  onClick={() => setAmountRuleType('percent_balance')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: amountRuleType === 'percent_balance' ? '#334155' : 'transparent',
                    border: amountRuleType === 'percent_balance' ? '1px solid #38bdf8' : '1px solid #1e293b',
                    color: amountRuleType === 'percent_balance' ? '#f8fafc' : '#64748b',
                    fontSize: '11px',
                    fontWeight: amountRuleType === 'percent_balance' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Percent size={13} />
                  Percent of Available Balance
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {amountRuleType === 'fixed' ? 'Units to transfer each tick:' : '% of sender balance each tick:'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountValue}
                    onChange={(e) => setAmountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '100px',
                      padding: '6px 8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      textAlign: 'right',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', width: '32px' }}>
                    {amountRuleType === 'fixed' ? (sourceCurrency?.symbol || sourceCurrencyId) : '%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Condition Trigger */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Trigger Condition
            </label>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConditionType('always')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: conditionType === 'always' ? '#334155' : 'transparent',
                    border: conditionType === 'always' ? '1px solid #38bdf8' : '1px solid #1e293b',
                    color: conditionType === 'always' ? '#f8fafc' : '#64748b',
                    fontSize: '11px',
                    fontWeight: conditionType === 'always' ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  Always Execute
                </button>
                <button
                  type="button"
                  onClick={() => setConditionType('min_balance')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: conditionType === 'min_balance' ? '#334155' : 'transparent',
                    border: conditionType === 'min_balance' ? '1px solid #38bdf8' : '1px solid #1e293b',
                    color: conditionType === 'min_balance' ? '#f8fafc' : '#64748b',
                    fontSize: '11px',
                    fontWeight: conditionType === 'min_balance' ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  Minimum Balance Guard
                </button>
              </div>

              {conditionType === 'min_balance' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1e293b',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Require sender to have at least:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={threshold}
                      onChange={(e) => setThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100px',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', width: '32px' }}>
                      {sourceCurrency?.symbol || sourceCurrencyId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Label & Active Status */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  Route Label (Optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Trade Route Alpha"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ paddingTop: '16px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: active ? '#34d399' : '#64748b',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{ accentColor: '#34d399', cursor: 'pointer' }}
                  />
                  Active Route
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
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
                color: '#94a3b8',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                backgroundColor: '#38bdf8',
                border: 'none',
                color: '#0f172a',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.4)',
              }}
            >
              <span>Create Connection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
