import React from 'react'
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
  nodeDimensions = { width: 200, height: 80 },
}) => {
  const sourceCurrency = currencies.find((c) => c.id === transaction.sourceCurrencyId)
  const strokeColor = sourceCurrency?.color || '#94a3b8'

  // Calculate dynamic floating connection intersection points at the edges of the nodes
  const edgeParams = getEdgeParams(
    { position: sourceNode.position, measured: nodeDimensions },
    { position: targetNode.position, measured: nodeDimensions }
  )

  const { sx, sy, tx, ty } = edgeParams

  // Straight line from source edge to target edge (NO CURVES)
  const pathData = `M ${sx} ${sy} L ${tx} ${ty}`

  // Center midpoint position for transfer rule label
  const midX = (sx + tx) / 2
  const midY = (sy + ty) / 2

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
        {/* Terminal Arrowhead Marker at the target node edge */}
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path
            d="M 0 1.5 L 9 5 L 0 8.5 z"
            fill={selected ? '#38bdf8' : strokeColor}
          />
        </marker>
      </defs>

      {/* Invisible wider stroke for easy click selection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        strokeLinecap="round"
      />

      {/* Outer glow when selected */}
      {selected && (
        <path
          d={pathData}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={5}
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
      )}

      {/* Active Directed Straight Edge Wire with Arrowhead at Target Edge */}
      <path
        d={pathData}
        fill="none"
        stroke={selected ? '#38bdf8' : strokeColor}
        strokeWidth={selected ? 2.5 : 1.75}
        strokeDasharray={transaction.active ? undefined : '6,4'}
        strokeOpacity={transaction.active ? 0.9 : 0.4}
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
      />

      {/* Midpoint Label Badge */}
      <g
        transform={`translate(${midX}, ${midY})`}
        style={{ pointerEvents: 'none' }}
      >
        <rect
          x="-35"
          y="-10"
          width="70"
          height="20"
          rx="4"
          fill="#181a20"
          stroke={selected ? '#38bdf8' : '#2d3139'}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
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
          {transferRuleText}
        </text>
      </g>
    </g>
  )
}

export default EdgeView
