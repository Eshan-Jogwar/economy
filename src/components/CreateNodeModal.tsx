import React, { useState, useEffect } from 'react'
import {
  X,
  CircleDot,
  UserCheck,
  Building2,
  Landmark,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  MapPin,
} from 'lucide-react'
import { NodeRole, NodeRule, SimulationNode, Currency } from '../types/simulation'

interface CreateNodeModalProps {
  isOpen: boolean
  initialRole: NodeRole
  canvasPosition: { x: number; y: number }
  currencies: Currency[]
  existingNodeCount: number
  onConfirm: (nodeData: Omit<SimulationNode, 'id'>) => void
  onCancel: () => void
}

const ROLE_PRESETS: Record<
  NodeRole,
  {
    name: string
    defaultLabel: string
    icon: typeof UserCheck
    color: string
    description: string
    defaultRule: NodeRule
    defaultBalance: number
  }
> = {
  generic: {
    name: 'Generic Node / Junction',
    defaultLabel: 'Node',
    icon: CircleDot,
    color: '#38bdf8',
    description: 'A universal economic node capable of holding and transferring funds across transactions.',
    defaultRule: { type: 'none', currencyId: '', amount: 0 },
    defaultBalance: 100,
  },
  bank: {
    name: 'Central Bank / Reserve',
    defaultLabel: 'Reserve Bank',
    icon: Landmark,
    color: '#fbbf24',
    description: 'Holds reserves and acts as a financial liquidity anchor.',
    defaultRule: { type: 'none', currencyId: '', amount: 0 },
    defaultBalance: 1000,
  },
  market: {
    name: 'Market / Exchange Hub',
    defaultLabel: 'Marketplace',
    icon: Building2,
    color: '#a78bfa',
    description: 'Facilitates trade and multi-currency foreign exchange conversions.',
    defaultRule: { type: 'none', currencyId: '', amount: 0 },
    defaultBalance: 250,
  },
  agent: {
    name: 'Agent / Household',
    defaultLabel: 'Household',
    icon: UserCheck,
    color: '#06b6d4',
    description: 'An individual or household economic actor holding and transferring funds.',
    defaultRule: { type: 'none', currencyId: '', amount: 0 },
    defaultBalance: 100,
  },
  mint: {
    name: 'Mint / Wealth Generator',
    defaultLabel: 'Treasury Mint',
    icon: Coins,
    color: '#34d399',
    description: 'Autonomous currency creator; automatically mints money each tick.',
    defaultRule: { type: 'mint', currencyId: '', amount: 20 },
    defaultBalance: 0,
  },
  sink: {
    name: 'Consumption Sink / Tax Drain',
    defaultLabel: 'Consumer Sink',
    icon: Flame,
    color: '#f87171',
    description: 'Autonomous consumer or tax collector; permanently drains money each tick.',
    defaultRule: { type: 'drain', currencyId: '', amount: 15 },
    defaultBalance: 0,
  },
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  initialRole,
  canvasPosition,
  currencies,
  existingNodeCount,
  onConfirm,
  onCancel,
}) => {
  const [role, setRole] = useState<NodeRole>(initialRole)
  const [label, setLabel] = useState<string>('')
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [ruleType, setRuleType] = useState<'none' | 'mint' | 'drain'>('none')
  const [ruleCurrencyId, setRuleCurrencyId] = useState<string>('')
  const [ruleAmount, setRuleAmount] = useState<number>(10)

  // Sync state whenever modal opens or role changes
  useEffect(() => {
    if (!isOpen) return
    const config = ROLE_PRESETS[initialRole] || ROLE_PRESETS.generic
    setRole(initialRole)
    setLabel(`${config.defaultLabel} ${existingNodeCount + 1}`)

    const initialBalances: Record<string, number> = {}
    currencies.forEach((c) => {
      initialBalances[c.id] = config.defaultBalance
    })
    setBalances(initialBalances)

    const defaultCurId = currencies[0]?.id || ''
    setRuleType(config.defaultRule.type)
    setRuleCurrencyId(defaultCurId)
    setRuleAmount(config.defaultRule.amount || 10)
  }, [isOpen, initialRole, existingNodeCount, currencies])

  // Update defaults when user changes role inside modal
  const handleRoleChange = (newRole: NodeRole) => {
    const config = ROLE_PRESETS[newRole]
    setRole(newRole)
    setLabel(`${config.defaultLabel} ${existingNodeCount + 1}`)
    setRuleType(config.defaultRule.type)
    setRuleAmount(config.defaultRule.amount || 10)

    const newBalances: Record<string, number> = {}
    currencies.forEach((c) => {
      newBalances[c.id] = config.defaultBalance
    })
    setBalances(newBalances)
  }

  const handleBalanceChange = (currId: string, val: string) => {
    const num = parseFloat(val)
    setBalances((prev) => ({
      ...prev,
      [currId]: isNaN(num) ? 0 : Math.max(0, num),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedLabel = label.trim() || `${ROLE_PRESETS[role].defaultLabel} ${existingNodeCount + 1}`
    
    let rule: NodeRule | undefined = undefined
    if (ruleType !== 'none') {
      rule = {
        type: ruleType,
        currencyId: ruleCurrencyId || (currencies[0]?.id ?? 'CRD'),
        amount: Math.max(0, ruleAmount),
      }
    }

    onConfirm({
      label: trimmedLabel,
      role,
      position: canvasPosition,
      balances,
      rule,
    })
  }

  if (!isOpen) return null

  const currentConfig = ROLE_PRESETS[role]
  const RoleIcon = currentConfig.icon

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
          maxWidth: '520px',
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
        onMouseDown={(e) => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: `${currentConfig.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${currentConfig.color}40`,
              }}
            >
              <RoleIcon size={18} color={currentConfig.color} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Create Simulation Node</div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MapPin size={10} />
                Position: ({Math.round(canvasPosition.x)}, {Math.round(canvasPosition.y)})
              </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px' }}>
          {/* Role Picker Selector */}
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
              Node Role / Type
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {(Object.keys(ROLE_PRESETS) as NodeRole[]).map((r) => {
                const conf = ROLE_PRESETS[r]
                const Icon = conf.icon
                const isSelected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleRoleChange(r)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? `${conf.color}25` : '#1e293b',
                      border: isSelected ? `2px solid ${conf.color}` : '1px solid #334155',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={conf.color} />
                    <span style={{ textTransform: 'capitalize' }}>{conf.defaultLabel}</span>
                  </button>
                )
              })}
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: '#090d16',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>💡 Generic Node:</span> {currentConfig.description}
            </div>
          </div>

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
              placeholder="e.g. Household Cohort A"
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

          {/* Initial Balances */}
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
                Initial Starting Balances
              </label>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                Set starting liquidity for simulation
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: '#090d16',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              {currencies.map((curr) => (
                <div
                  key={curr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: curr.color,
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#f8fafc' }}>
                      {curr.name} ({curr.symbol || curr.id})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={balances[curr.id] ?? 0}
                      onChange={(e) => handleBalanceChange(curr.id, e.target.value)}
                      style={{
                        width: '110px',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: curr.color,
                        fontWeight: 600,
                        fontSize: '12px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', width: '24px' }}>
                      {curr.symbol}
                    </span>
                  </div>
                </div>
              ))}
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
                <button
                  type="button"
                  onClick={() => setRuleType('none')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: ruleType === 'none' ? '#334155' : 'transparent',
                    border: ruleType === 'none' ? '1px solid #38bdf8' : '1px solid #1e293b',
                    color: ruleType === 'none' ? '#f8fafc' : '#64748b',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  None (Passive)
                </button>
                <button
                  type="button"
                  onClick={() => setRuleType('mint')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: ruleType === 'mint' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                    border: ruleType === 'mint' ? '1px solid #34d399' : '1px solid #1e293b',
                    color: ruleType === 'mint' ? '#34d399' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <PlusCircle size={13} />
                  Mint (+/tick)
                </button>
                <button
                  type="button"
                  onClick={() => setRuleType('drain')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: ruleType === 'drain' ? 'rgba(248, 113, 113, 0.15)' : 'transparent',
                    border: ruleType === 'drain' ? '1px solid #f87171' : '1px solid #1e293b',
                    color: ruleType === 'drain' ? '#f87171' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <MinusCircle size={13} />
                  Drain (-/tick)
                </button>
              </div>

              {ruleType !== 'none' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1e293b',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Target Currency
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
                  <div style={{ width: '130px' }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Amount / Tick
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ruleAmount}
                      onChange={(e) => setRuleAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: ruleType === 'mint' ? '#34d399' : '#f87171',
                        fontWeight: 600,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
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
              <span>Create Node</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
