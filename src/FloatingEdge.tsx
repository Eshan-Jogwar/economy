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

      {/* Main floating straight edge path with terminal arrow at target edge */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: strokeColor,
          ...style,
        }}
      />
    </g>
  )
}

export default FloatingEdge
