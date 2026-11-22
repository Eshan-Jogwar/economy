import React from 'react'
import {
  X,
  Trash2,
  CircleDot,
  Building2,
  Landmark,
  UserCheck,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  Slash,
} from 'lucide-react'
import { SimulationNode, Currency, NodeRole } from '../types/simulation'

interface NodeInspectorProps {
  node: SimulationNode | null
  currencies: Currency[]
  onClose: () => void
  onUpdateNode: (updatedNode: SimulationNode) => void
  onDeleteNode: (nodeId: string) => void
}

const ROLES: { role: NodeRole; label: string; icon: React.FC<any>; color: string }[] = [
  { role: 'generic', label: 'Generic Node', icon: CircleDot, color: '#38bdf8' },
  { role: 'bank', label: 'Bank', icon: Landmark, color: '#fbbf24' },
  { role: 'market', label: 'Market / Exchange', icon: Building2, color: '#a78bfa' },
  { role: 'agent', label: 'Agent', icon: UserCheck, color: '#06b6d4' },
  { role: 'mint', label: 'Mint / Source', icon: Coins, color: '#34d399' },
  { role: 'sink', label: 'Drain / Sink', icon: Flame, color: '#f87171' },
]

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  currencies,
  onClose,
  onUpdateNode,
  onDeleteNode,
}) => {
  if (!node) return null

  const handleLabelChange = (label: string) => {
    onUpdateNode({ ...node, label })
  }

  const handleRoleChange = (role: NodeRole) => {
    onUpdateNode({ ...node, role })
  }

  const handleBalanceChange = (currencyId: string, value: number) => {
    const updatedBalances = { ...node.balances, [currencyId]: Math.max(0, value) }
    onUpdateNode({ ...node, balances: updatedBalances })
  }

  const handleRuleTypeChange = (type: 'none' | 'mint' | 'drain') => {
    if (type === 'none') {
      onUpdateNode({ ...node, rule: undefined })
    } else {
      const defaultCurrencyId = node.rule?.currencyId || currencies[0]?.id || 'CURR'
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

  const activeRole = ROLES.find((r) => r.role === node.role) || ROLES[0]
  const ActiveIcon = activeRole.icon

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
          <ActiveIcon size={18} color={activeRole.color} />
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

        {/* Role Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Economic Role
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {ROLES.map((r) => {
              const isSelected = node.role === r.role
              const Icon = r.icon
              return (
                <button
                  key={r.role}
                  onClick={() => handleRoleChange(r.role)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: isSelected ? `${r.color}22` : '#1e293b',
                    border: isSelected ? `1px solid ${r.color}` : '1px solid #334155',
                    borderRadius: '6px',
                    color: isSelected ? r.color : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={14} color={isSelected ? r.color : '#64748b'} />
                  <span>{r.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Balances */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
            Holdings / Balances
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currencies.map((cur) => {
              const currentVal = node.balances[cur.id] ?? 0
              return (
                <div
                  key={cur.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: cur.color,
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: cur.color }}>
                      {cur.symbol}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{cur.name}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={cur.decimals === 0 ? 1 : 0.1}
                    value={currentVal}
                    onChange={(e) => handleBalanceChange(cur.id, parseFloat(e.target.value) || 0)}
                    style={{
                      width: '90px',
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
