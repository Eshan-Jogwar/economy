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
      {/* Live Straight Connection Path */}
      <path
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: '5,5',
          ...connectionLineStyle,
        }}
        fill="none"
        d={edgePath}
      />

      {/* Target cursor arrowhead clearly indicating where connection flows */}
      <g transform={`translate(${toX}, ${toY}) rotate(${angle})`}>
        <polygon
          points="-10,-5 0,0 -10,5 -7,0"
          fill={strokeColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </g>
    </g>
  )
}

export default CustomConnectionLine
