import React, { useState } from 'react'
import { X, Plus, Trash2, Coins, Check } from 'lucide-react'
import { Currency } from '../types/simulation'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  currencies: Currency[]
  onAddCurrency: (currency: Currency) => void
  onUpdateCurrency: (currency: Currency) => void
  onDeleteCurrency: (currencyId: string) => void
}

const PRESET_COLORS = [
  '#EAB308', // Gold
  '#10B981', // Emerald
  '#38BDF8', // Sky
  '#8B5CF6', // Violet
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#94A3B8', // Slate
]

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  currencies,
  onAddCurrency,
  onUpdateCurrency,
  onDeleteCurrency,
}) => {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [decimals, setDecimals] = useState(2)
  const [baseExchangeRate, setBaseExchangeRate] = useState(1.0)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

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

    const id = trimmedSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '') || `CURR_${Date.now().toString(36).toUpperCase()}`

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
    })

    setName('')
    setSymbol('')
    setColor(PRESET_COLORS[(currencies.length + 1) % PRESET_COLORS.length])
    setError(null)
  }

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
          maxWidth: '560px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          color: '#f8fafc',
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={20} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Custom Currency Registry
            </h2>
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

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
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
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
              Create Custom Currency
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  placeholder="e.g. ☼, ₡, AUR"
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

              <div style={{ display: 'flex', gap: '12px' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Base Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={baseExchangeRate}
                    onChange={(e) => setBaseExchangeRate(parseFloat(e.target.value) || 1)}
                    style={{
                      width: '70px',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: '11px', color: '#f87171' }}>{error}</div>
            )}

            <button
              type="submit"
              style={{
                alignSelf: 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Add Currency</span>
            </button>
          </form>

          {/* Existing Currencies List */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
              Configured Currencies ({currencies.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currencies.map((cur) => (
                <div
                  key={cur.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: cur.color,
                        boxShadow: `0 0 8px ${cur.color}88`,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        {cur.name}{' '}
                        <span style={{ color: cur.color, fontFamily: 'monospace' }}>
                          [{cur.symbol}]
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        ID: {cur.id} · Decimals: {cur.decimals} · Base Rate: {cur.baseExchangeRate}
                      </div>
                    </div>
                  </div>

                  {currencies.length > 1 && (
                    <button
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
