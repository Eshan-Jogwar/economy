import React from 'react'
import { SimulationTransaction, Currency, SimulationNode } from '../types/simulation'

interface EdgeViewProps {
  transaction: SimulationTransaction
  sourceNode: SimulationNode
  targetNode: SimulationNode
  currencies: Currency[]
  selected?: boolean
  onSelect?: () => void
  nodeDimensions?: { width: number; height: number }
}

export const EdgeView: React.FC<EdgeViewProps> = ({
  transaction,
  sourceNode,
  targetNode,
  currencies,
  selected = false,
  onSelect,
  nodeDimensions = { width: 220, height: 130 },
}) => {
  const sourceCurrency = currencies.find((c) => c.id === transaction.sourceCurrencyId)
  const targetCurrency = currencies.find((c) => c.id === transaction.targetCurrencyId)

  const strokeColor = sourceCurrency?.color || '#94a3b8'
  const isMultiCurrency = transaction.sourceCurrencyId !== transaction.targetCurrencyId

  // Sockets: source right edge to target left edge
  const srcX = sourceNode.position.x + nodeDimensions.width
  const srcY = sourceNode.position.y + nodeDimensions.height / 2
  const tgtX = targetNode.position.x
  const tgtY = targetNode.position.y + nodeDimensions.height / 2

  // Blender-style cubic Bezier curve control points
  const dx = Math.max(Math.abs(tgtX - srcX) * 0.55, 60)
  const ctrl1X = srcX + dx
  const ctrl1Y = srcY
  const ctrl2X = tgtX - dx
  const ctrl2Y = tgtY

  const pathData = `M ${srcX} ${srcY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${tgtX} ${tgtY}`

  // Center badge position at t = 0.5
  const badgeX = 0.125 * srcX + 0.375 * ctrl1X + 0.375 * ctrl2X + 0.125 * tgtX
  const badgeY = 0.125 * srcY + 0.375 * ctrl1Y + 0.375 * ctrl2Y + 0.125 * tgtY

  let transferRuleText = ''
  if (transaction.amountRule.type === 'fixed') {
    transferRuleText = `${transaction.amountRule.value} ${sourceCurrency?.symbol || transaction.sourceCurrencyId}`
  } else {
    transferRuleText = `${transaction.amountRule.value}% ${sourceCurrency?.symbol || transaction.sourceCurrencyId}`
  }

  const markerId = `arrow-${transaction.id}`

  return (
    <g
      className={`edge-group ${selected ? 'edge-selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill={selected ? '#38bdf8' : strokeColor} />
        </marker>
      </defs>

      {/* Invisible wider stroke for easy click selection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        strokeLinecap="round"
      />

      {/* Outer glow when selected */}
      {selected && (
        <path
          d={pathData}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={6}
          strokeOpacity={0.4}
          strokeLinecap="round"
        />
      )}

      {/* Active Directed Edge Wire */}
      <path
        d={pathData}
        fill="none"
        stroke={selected ? '#38bdf8' : strokeColor}
        strokeWidth={selected ? 2.5 : 2}
        strokeDasharray={transaction.active ? undefined : '6,4'}
        strokeOpacity={transaction.active ? 0.9 : 0.4}
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
      />

      {/* Midpoint Label Badge */}
      <g
        transform={`translate(${badgeX}, ${badgeY})`}
        style={{ pointerEvents: 'none' }}
      >
        <rect
          x="-50"
          y="-13"
          width="100"
          height="26"
          rx="5"
          fill="#0f172a"
          stroke={selected ? '#38bdf8' : '#334155'}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
        />
        <text
          x="0"
          y="-1"
          fill="#f8fafc"
          fontSize="9"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="monospace"
        >
          {transferRuleText}
        </text>
        {isMultiCurrency && (
          <text
            x="0"
            y="7"
            fill={targetCurrency?.color || '#a78bfa'}
            fontSize="8"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
          >
            ×{transaction.exchangeRate} {targetCurrency?.symbol || transaction.targetCurrencyId}
          </text>
        )}
      </g>
    </g>
  )
}
