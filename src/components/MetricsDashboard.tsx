import React from 'react'
import { X, Activity, PieChart, Wallet } from 'lucide-react'
import { SimulationNode, Currency, TickSnapshot } from '../types/simulation'
import { calculateTotalSupply, calculateVelocity } from '../engine/simulationEngine'
import { getBaseExchangeRate } from '../utils/currency'

interface MetricsDashboardProps {
  isOpen: boolean
  onClose: () => void
  nodes: SimulationNode[]
  currencies: Currency[]
  history: TickSnapshot[]
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  isOpen,
  onClose,
  nodes,
  currencies,
  history,
}) => {
  if (!isOpen) return null

  const totalSupply = calculateTotalSupply(nodes)

  // Generate SVG Sparkline for history of a currency
  const renderSparkline = (currencyId: string, color: string) => {
    const points = history.slice(-30).map((h) => h.totalBalances[currencyId] || 0)
    if (points.length < 2) {
      return (
        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', height: '36px', display: 'flex', alignItems: 'center' }}>
          Collecting tick points...
        </div>
      )
    }

    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const width = 160
    const height = 36
    const step = width / (points.length - 1)

    const pathD = points
      .map((p, i) => {
        const x = i * step
        const y = height - ((p - min) / range) * (height - 8) - 4
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
      </svg>
    )
  }

  // Wealth distribution: sum of standard wealth (balance * baseExchangeRate)
  const nodeWealth = nodes.map((node) => {
    let normalizedWealth = 0
    for (const [curId, amount] of Object.entries(node.balances)) {
      const cur = currencies.find((c) => c.id === curId)
      normalizedWealth += (amount || 0) * getBaseExchangeRate(cur)
    }
    return { id: node.id, label: node.label, role: node.role, wealth: normalizedWealth }
  }).sort((a, b) => b.wealth - a.wealth)

  const totalSystemWealth = nodeWealth.reduce((acc, curr) => acc + curr.wealth, 0) || 1

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '240px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        zIndex: 45,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Economic Analytics & Supply Trends</span>
          <span
            style={{
              fontSize: '11px',
              color: '#10b981',
              fontWeight: 600,
              padding: '2px 8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '4px',
            }}
          >
            Total Wealth: ${totalSystemWealth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Metrics Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          padding: '12px 16px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {/* Currencies Supply Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={12} color="#38bdf8" />
            <span>CIRCULATING CURRENCY SUPPLY & VELOCITY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {currencies.map((cur) => {
              const supply = totalSupply[cur.id] ?? 0
              const velocity = calculateVelocity(history, cur.id)
              return (
                <div
                  key={cur.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        {cur.name} ({cur.symbol})
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: cur.isDefault ? '#10b981' : '#94a3b8', fontFamily: 'monospace' }}>
                      1 {cur.symbol} = ${cur.baseExchangeRate.toFixed(2)} USD
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#f8fafc' }}>
                      {supply.toLocaleString(undefined, {
                        minimumFractionDigits: cur.decimals,
                        maximumFractionDigits: cur.decimals,
                      })}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Velocity: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{velocity.toFixed(2)}</span>
                    </span>
                  </div>

                  {/* Sparkline chart */}
                  <div style={{ marginTop: '4px' }}>
                    {renderSparkline(cur.id, cur.color)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wealth Distribution Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PieChart size={12} color="#a78bfa" />
            <span>NORMALIZED WEALTH SHARE BY NODE</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {nodeWealth.map((nw) => {
              const percent = Math.round((nw.wealth / totalSystemWealth) * 100)
              return (
                <div key={nw.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{nw.label}</span>
                    <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      ${nw.wealth.toFixed(2)} USD ({percent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        backgroundColor: '#38bdf8',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
