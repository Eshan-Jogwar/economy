import React from 'react'
import { EdgeProps, getStraightPath, useInternalNode } from '@xyflow/react'
import { getEdgeParams } from './utils'

function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode)

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  // Calculate midpoint and angle for directional flow arrow
  const midX = (sx + tx) / 2
  const midY = (sy + ty) / 2
  const angle = Math.atan2(ty - sy, tx - sx) * (180 / Math.PI)
  const strokeColor = (style?.stroke as string) || '#b1b1b7'

  return (
    <g className="react-flow__edge floating-edge-group">
      {/* Invisible wider stroke for interaction/selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="react-flow__edge-interaction"
      />

      {/* Main floating edge path with terminal arrow */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2.5,
          stroke: strokeColor,
          ...style,
        }}
      />

      {/* Midpoint directional flow arrow showing where connection flows */}
      <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
        <polygon
          points="-6,-4 4,0 -6,4 -3,0"
          fill={strokeColor}
          stroke={strokeColor}
          strokeWidth={1}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        />
      </g>
    </g>
  )
}

export default FloatingEdge
