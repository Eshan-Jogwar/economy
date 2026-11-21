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

  // Node centers
  const srcCenterX = sourceNode.position.x + nodeDimensions.width / 2
  const srcCenterY = sourceNode.position.y + nodeDimensions.height / 2
  const tgtCenterX = targetNode.position.x + nodeDimensions.width / 2
  const tgtCenterY = targetNode.position.y + nodeDimensions.height / 2

  const dx = tgtCenterX - srcCenterX
  const dy = tgtCenterY - srcCenterY
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  // Offset control point for organic curvature
  const midX = (srcCenterX + tgtCenterX) / 2
  const midY = (srcCenterY + tgtCenterY) / 2
  const curveOffset = Math.min(60, dist * 0.18)
  const ctrlX = midX - (dy / dist) * curveOffset
  const ctrlY = midY + (dx / dist) * curveOffset

  let transferRuleText = ''
  if (transaction.amountRule.type === 'fixed') {
    transferRuleText = `${transaction.amountRule.value} ${sourceCurrency?.symbol || transaction.sourceCurrencyId}`
  } else {
    transferRuleText = `${transaction.amountRule.value}% ${sourceCurrency?.symbol || transaction.sourceCurrencyId}`
  }

  const pathData = `M ${srcCenterX} ${srcCenterY} Q ${ctrlX} ${ctrlY} ${tgtCenterX} ${tgtCenterY}`

  const badgeX = 0.25 * srcCenterX + 0.5 * ctrlX + 0.25 * tgtCenterX
  const badgeY = 0.25 * srcCenterY + 0.5 * ctrlY + 0.25 * tgtCenterY

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

      {/* Invisible wider stroke for easy click */}
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

      {/* Visible directed edge line */}
      <path
        d={pathData}
        fill="none"
        stroke={selected ? '#38bdf8' : strokeColor}
        strokeWidth={selected ? 2.5 : 2}
        strokeOpacity={transaction.active ? 0.85 : 0.3}
        strokeDasharray={transaction.active ? undefined : '5,5'}
        markerEnd={`url(#${markerId})`}
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
      />

      {/* Edge information badge at midpoint */}
      <g transform={`translate(${badgeX}, ${badgeY})`}>
        <rect
          x={-60}
          y={-14}
          width={120}
          height={28}
          rx={6}
          fill={selected ? '#0f172a' : '#1e293b'}
          stroke={selected ? '#38bdf8' : '#334155'}
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={-1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f1f5f9"
          fontSize="11"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          {transferRuleText}
        </text>
        {isMultiCurrency && (
          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={targetCurrency?.color || '#94a3b8'}
            fontSize="9"
            fontFamily="monospace"
          >
            {`fx ×${transaction.exchangeRate} ${targetCurrency?.symbol || transaction.targetCurrencyId}`}
          </text>
        )}
      </g>
    </g>
  )
}
