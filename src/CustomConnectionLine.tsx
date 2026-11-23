import React from 'react'
import { ConnectionLineComponentProps, getStraightPath } from '@xyflow/react'

function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  })

  // Calculate flow angle to point arrow in direction of connection
  const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI)
  const strokeColor = (connectionLineStyle?.stroke as string) || '#b1b1b7'

  return (
    <g className="custom-connection-line">
      {/* Live Connection Path */}
      <path
        style={{
          stroke: strokeColor,
          strokeWidth: 2.5,
          strokeDasharray: '6,4',
          ...connectionLineStyle,
        }}
        fill="none"
        d={edgePath}
      />

      {/* Origin socket anchor */}
      <circle cx={fromX} cy={fromY} fill={strokeColor} r={4} />

      {/* Target cursor arrowhead clearly indicating where connection flows */}
      <g transform={`translate(${toX}, ${toY}) rotate(${angle})`}>
        <polygon
          points="-12,-6 0,0 -12,6 -8,0"
          fill={strokeColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </g>
    </g>
  )
}

export default CustomConnectionLine
