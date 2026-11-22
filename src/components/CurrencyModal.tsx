import React, { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  Coins,
  Check,
  TrendingUp,
  ArrowRight,
  Calculator,
  Grid,
  ShieldCheck,
  Info,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react'
import { Currency } from '../types/simulation'
import {
  calculateTransitiveRate,
  calculateTransitiveBreakdown,
  DEFAULT_BASE_CURRENCY,
} from '../utils/currency'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  currencies: Currency[]
  onAddCurrency: (currency: Currency) => void
  onUpdateCurrency: (currency: Currency) => void
  onDeleteCurrency: (currencyId: string) => void
  defaultCurrencyId?: string
  onSetDefaultCurrency?: (currencyId: string) => void
}

const PRESET_COLORS = [
  '#10B981', // Emerald (Dollar)
  '#E0A938', // Gold / Aurum
  '#38BDF8', // Sky
  '#8B5CF6', // Violet
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#94A3B8', // Slate / Silver
]

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  currencies,
  onAddCurrency,
  onUpdateCurrency,
  onDeleteCurrency,
  defaultCurrencyId = 'USD',
  onSetDefaultCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'currencies' | 'triangulation'>('currencies')

  // Form State
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[1])
  const [decimals, setDecimals] = useState(2)
  const [baseExchangeRate, setBaseExchangeRate] = useState(1.0)
  const [error, setError] = useState<string | null>(null)

  // Calculator State
  const [calcSourceId, setCalcSourceId] = useState<string>(
    currencies[1]?.id || currencies[0]?.id || 'USD'
  )
  const [calcTargetId, setCalcTargetId] = useState<string>(
    currencies[2]?.id || currencies[0]?.id || 'USD'
  )
  const [calcAmount, setCalcAmount] = useState<number>(100)

  if (!isOpen) return null

  const baseCurrency =
    currencies.find((c) => c.id === defaultCurrencyId || c.isDefault) ||
    currencies.find((c) => c.id === 'USD') ||
    DEFAULT_BASE_CURRENCY

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedSymbol = symbol.trim()

    if (!trimmedName) {
      setError('Currency name is required')
      return
    }
    if (!trimmedSymbol) {
      setError('Currency symbol or code is required')
      return
    }

    const id =
      trimmedSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      `CURR_${Date.now().toString(36).toUpperCase()}`

    if (currencies.some((c) => c.id === id)) {
      setError(`Currency code/ID '${id}' already exists`)
      return
    }

    onAddCurrency({
      id,
      name: trimmedName,
      symbol: trimmedSymbol,
      color,
      decimals,
      baseExchangeRate: Math.max(0.0001, baseExchangeRate),
      isDefault: false,
    })

    setName('')
    setSymbol('')
    setColor(PRESET_COLORS[(currencies.length + 1) % PRESET_COLORS.length])
    setError(null)
  }

  // Interactive calculation
  const breakdown = calculateTransitiveBreakdown(
    calcAmount,
    calcSourceId,
    calcTargetId,
    currencies
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
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
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Coins size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  Custom Currency Registry & FX Triangulation
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {baseCurrency.name} ({baseCurrency.symbol}) Base Anchor
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                All cross-rates triangulate through the default currency as an intermediate pivot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#090d16',
            padding: '0 16px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('currencies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'currencies' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'currencies' ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Coins size={14} />
            <span>Currencies & Dollar Pegs ({currencies.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('triangulation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'triangulation' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'triangulation' ? '2px solid #38bdf8' : '2px solid transparent',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Calculator size={14} />
            <span>Transitive FX Matrix & Calculator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {activeTab === 'currencies' ? (
            <>
              {/* Default Base Currency Spotlight Banner */}
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '20px',
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {baseCurrency.symbol}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      {baseCurrency.name} ({baseCurrency.id})
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: '#10b981',
                        color: '#064e3b',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      <ShieldCheck size={12} />
                      Default Base & Intermediate Anchor
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                    The Dollar serves as the transient pivot for all foreign exchange conversions.
                    When any transaction executes between two different currencies (e.g. <em>AUR → SLV</em>),
                    the transfer rate triangulates through Dollar:
                    <br />
                    <span style={{ fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 600 }}>
                      Rate(A → B) = Rate(A → USD) / Rate(B → USD)
                    </span>
                  </p>
                </div>
              </div>

              {/* Add New Currency Form */}
              <form
                onSubmit={handleCreate}
                style={{
                  padding: '14px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    Create Custom Currency
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Pegged against {baseCurrency.name} ({baseCurrency.symbol})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Solar Credit, Aurum"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Symbol / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ☼, ₡, EUR"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Value in {baseCurrency.symbol} USD (Base Peg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={baseExchangeRate}
                      onChange={(e) => setBaseExchangeRate(parseFloat(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Color & Decimals */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                      Color Token
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: c,
                            border: color === c ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.4)',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {color === c && <Check size={12} color="#000000" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                        Decimals
                      </label>
                      <select
                        value={decimals}
                        onChange={(e) => setDecimals(Number(e.target.value))}
                        style={{
                          padding: '6px 8px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      >
                        <option value={0}>0 (Integer)</option>
                        <option value={1}>1 (0.0)</option>
                        <option value={2}>2 (0.00)</option>
                        <option value={4}>4 (0.0000)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '16px',
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Currency</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ fontSize: '11px', color: '#f87171' }}>{error}</div>
                )}
              </form>

              {/* Configured Currencies List */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
                  Configured Currencies ({currencies.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currencies.map((cur) => {
                    const isBase = cur.id === baseCurrency.id || cur.isDefault
                    const inverseRate = cur.baseExchangeRate > 0 ? (1 / cur.baseExchangeRate).toFixed(3) : '0'

                    return (
                      <div
                        key={cur.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          backgroundColor: isBase ? 'rgba(16, 185, 129, 0.05)' : '#1e293b',
                          borderRadius: '8px',
                          border: isBase ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #334155',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: cur.color,
                              boxShadow: `0 0 8px ${cur.color}88`,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{cur.name}</span>
                              <span style={{ color: cur.color, fontFamily: 'monospace' }}>
                                [{cur.symbol}]
                              </span>
                              {isBase && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#10b981',
                                    color: '#064e3b',
                                    fontWeight: 700,
                                  }}
                                >
                                  BASE
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              ID: {cur.id} · Decimals: {cur.decimals}
                            </div>
                          </div>
                        </div>

                        {/* Dollar Peg Display & Inline Editor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              1 {cur.symbol} ={' '}
                              <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
                                ${cur.baseExchangeRate.toFixed(cur.decimals > 2 ? cur.decimals : 2)} USD
                              </span>
                            </div>
                            {!isBase && (
                              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                                ($1.00 = {inverseRate} {cur.symbol})
                              </div>
                            )}
                          </div>

                          {!isBase ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: '#64748b' }}>Peg ($):</label>
                              <input
                                type="number"
                                step="any"
                                min="0.0001"
                                value={cur.baseExchangeRate}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val) && val > 0) {
                                    onUpdateCurrency({ ...cur, baseExchangeRate: val })
                                  }
                                }}
                                style={{
                                  width: '70px',
                                  padding: '4px 6px',
                                  backgroundColor: '#0f172a',
                                  border: '1px solid #334155',
                                  borderRadius: '4px',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  textAlign: 'right',
                                }}
                              />
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#10b981',
                                fontWeight: 600,
                                padding: '4px 8px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '4px',
                              }}
                            >
                              Fixed Pivot $1.00
                            </span>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!isBase && onSetDefaultCurrency && (
                              <button
                                type="button"
                                title="Set as base anchor"
                                onClick={() => onSetDefaultCurrency(cur.id)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #334155',
                                  color: '#94a3b8',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                              >
                                Set Anchor
                              </button>
                            )}

                            {!isBase && currencies.length > 1 && (
                              <button
                                type="button"
                                title="Delete currency"
                                onClick={() => onDeleteCurrency(cur.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#64748b',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Transitive FX Matrix & Calculator */
            <>
              {/* Interactive Triangulation Calculator */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    Live Transitive Triangulation Calculator
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    (Simulate cross-currency conversion through Dollar pivot)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Source Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      From Currency
                    </label>
                    <select
                      value={calcSourceId}
                      onChange={(e) => setCalcSourceId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxSizing: 'border-box',
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
                      To Currency
                    </label>
                    <select
                      value={calcTargetId}
                      onChange={(e) => setCalcTargetId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2-Step Intermediate Visual Flow */}
                <div
                  style={{
                    backgroundColor: '#090d16',
                    borderRadius: '8px',
                    padding: '14px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Step 1: Source */}
                  <div style={{ flex: 1, minWidth: '130px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                      Step 1: Source Currency
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: breakdown.sourceCurrency?.color || '#f8fafc' }}>
                      {calcAmount.toFixed(breakdown.sourceCurrency?.decimals || 2)} {breakdown.sourceCurrency?.symbol}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Rate: ${breakdown.sourceRateInDollar.toFixed(2)} USD
                    </div>
                  </div>

                  {/* Flow Arrow 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#10b981' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600 }}>× ${breakdown.sourceRateInDollar.toFixed(2)}</span>
                    <ArrowRight size={16} />
                  </div>

                  {/* Step 2: Intermediate USD Anchor */}
                  <div
                    style={{
                      flex: 1.2,
                      minWidth: '160px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ★ Transient Pivot
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#6ee7b7', fontFamily: 'monospace' }}>
                      ${breakdown.intermediateDollarAmount.toFixed(2)} USD
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Base intermediate valuation
                    </div>
                  </div>

                  {/* Flow Arrow 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#38bdf8' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600 }}>÷ ${breakdown.targetRateInDollar.toFixed(2)}</span>
                    <ArrowRight size={16} />
                  </div>

                  {/* Step 3: Target Result */}
                  <div style={{ flex: 1, minWidth: '130px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                      Step 2: Target Result
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: breakdown.targetCurrency?.color || '#38bdf8' }}>
                      {breakdown.targetAmount.toFixed(breakdown.targetCurrency?.decimals || 2)} {breakdown.targetCurrency?.symbol}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Rate: ${breakdown.targetRateInDollar.toFixed(2)} USD
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Effective Transitive Cross-Rate:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                    1 {breakdown.sourceCurrency?.symbol} = {breakdown.effectiveRate.toFixed(4)} {breakdown.targetCurrency?.symbol}
                  </span>
                </div>
              </div>

              {/* Full N x N Transitive Cross-Rate Matrix */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Grid size={15} color="#a78bfa" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                      Transitive FX Cross-Rate Matrix (N × N)
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    Click any cell to load in calculator
                  </span>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      backgroundColor: '#1e293b',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#090d16', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontSize: '10px' }}>
                          FROM \ TO
                        </th>
                        {currencies.map((target) => (
                          <th
                            key={target.id}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'right',
                              color: target.color,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {target.symbol} {target.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currencies.map((source) => (
                        <tr
                          key={source.id}
                          style={{
                            borderBottom: '1px solid #334155',
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 12px',
                              color: source.color,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              backgroundColor: '#0b1120',
                            }}
                          >
                            {source.symbol} {source.id}
                          </td>
                          {currencies.map((target) => {
                            const isDiagonal = source.id === target.id
                            const rate = calculateTransitiveRate(source.id, target.id, currencies)

                            return (
                              <td
                                key={target.id}
                                onClick={() => {
                                  setCalcSourceId(source.id)
                                  setCalcTargetId(target.id)
                                }}
                                title={`1 ${source.symbol} = ${rate.toFixed(4)} ${target.symbol} (via USD)`}
                                style={{
                                  padding: '8px 10px',
                                  textAlign: 'right',
                                  fontFamily: 'monospace',
                                  cursor: 'pointer',
                                  backgroundColor: isDiagonal
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'transparent',
                                  color: isDiagonal
                                    ? '#64748b'
                                    : rate > 1
                                    ? '#34d399'
                                    : rate < 1
                                    ? '#f87171'
                                    : '#f8fafc',
                                  fontWeight: isDiagonal ? 400 : 600,
                                }}
                              >
                                {isDiagonal ? '1.0000' : rate.toFixed(4)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
