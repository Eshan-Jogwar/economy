import React from 'react'
import { Position } from '@xyflow/react'
import { SimulationTransaction, Currency, SimulationNode } from '../types/simulation'
import { getEdgeParams } from '../utils'

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

  // Calculate dynamic floating connection intersection points
  const edgeParams = getEdgeParams(
    { position: sourceNode.position, measured: nodeDimensions },
    { position: targetNode.position, measured: nodeDimensions }
  )

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams

  // Dynamic cubic Bezier curve control points based on facing perimeters
  const dx = Math.max(Math.abs(tx - sx) * 0.5, 45)
  const dy = Math.max(Math.abs(ty - sy) * 0.5, 45)

  let ctrl1X = sx
  let ctrl1Y = sy
  if (sourcePos === Position.Right) ctrl1X = sx + dx
  else if (sourcePos === Position.Left) ctrl1X = sx - dx
  else if (sourcePos === Position.Top) ctrl1Y = sy - dy
  else if (sourcePos === Position.Bottom) ctrl1Y = sy + dy

  let ctrl2X = tx
  let ctrl2Y = ty
  if (targetPos === Position.Left) ctrl2X = tx - dx
  else if (targetPos === Position.Right) ctrl2X = tx + dx
  else if (targetPos === Position.Top) ctrl2Y = ty - dy
  else if (targetPos === Position.Bottom) ctrl2Y = ty + dy

  const pathData = `M ${sx} ${sy} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${tx} ${ty}`

  // Midpoint badge position at t = 0.5
  const badgeX = 0.125 * sx + 0.375 * ctrl1X + 0.375 * ctrl2X + 0.125 * tx
  const badgeY = 0.125 * sy + 0.375 * ctrl1Y + 0.375 * ctrl2Y + 0.125 * ty

  // Derivative tangent vector at t = 0.5 to calculate orientation of flow arrow
  const tangentX = 0.75 * (ctrl1X - sx) + 1.5 * (ctrl2X - ctrl1X) + 0.75 * (tx - ctrl2X)
  const tangentY = 0.75 * (ctrl1Y - sy) + 1.5 * (ctrl2Y - ctrl1Y) + 0.75 * (ty - ctrl2Y)
  const flowAngle = Math.atan2(tangentY, tangentX) * (180 / Math.PI)

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
        {/* Terminal Arrow Marker showing connection target flow */}
        <marker
          id={markerId}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 2 L 11 6 L 1 10 L 3.5 6 Z"
            fill={selected ? '#38bdf8' : strokeColor}
          />
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

      {/* Active Directed Edge Wire with Flow Arrow at target end */}
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

      {/* Flow Direction Indicator Chevrons along the connection wire */}
      <g transform={`translate(${badgeX}, ${badgeY}) rotate(${flowAngle})`}>
        {/* Directional arrowhead showing flow towards target */}
        <polygon
          points="-8,-5 2,0 -8,5 -4,0"
          fill={selected ? '#38bdf8' : strokeColor}
          opacity={0.85}
        />
        <polygon
          points="-14,-5 -4,0 -14,5 -10,0"
          fill={selected ? '#38bdf8' : strokeColor}
          opacity={0.45}
        />
      </g>

      {/* Midpoint Label Badge */}
      <g
        transform={`translate(${badgeX}, ${badgeY + 16})`}
        style={{ pointerEvents: 'none' }}
      >
        <rect
          x="-55"
          y="-11"
          width="110"
          height="22"
          rx="5"
          fill="#0f172a"
          stroke={selected ? '#38bdf8' : '#334155'}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
        />
        <text
          x="0"
          y="0"
          fill="#f8fafc"
          fontSize="9"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="monospace"
        >
          ➔ {transferRuleText}
        </text>
        {isMultiCurrency && (
          <text
            x="0"
            y="9"
            fill={targetCurrency?.color || '#a78bfa'}
            fontSize="8"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
          >
            → {targetCurrency?.symbol || transaction.targetCurrencyId}
          </text>
        )}
      </g>
    </g>
  )
}

export default EdgeView
