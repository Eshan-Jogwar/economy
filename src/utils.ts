import { Position, XYPosition, InternalNode } from '@xyflow/react'

/**
 * Calculates the exact intersection point where the line between two node centers
 * intersects the bounding border of intersectionNode.
 */
export function getNodeIntersection(
  intersectionNode: InternalNode | { position: XYPosition; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: XYPosition } },
  targetNode: InternalNode | { position: XYPosition; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: XYPosition } }
): XYPosition {
  const width = intersectionNode.measured?.width ?? 150
  const height = intersectionNode.measured?.height ?? 80

  const nPos =
    (intersectionNode as any).internals?.positionAbsolute ??
    (intersectionNode as any).positionAbsolute ??
    intersectionNode.position ?? { x: 0, y: 0 }

  const tPos =
    (targetNode as any).internals?.positionAbsolute ??
    (targetNode as any).positionAbsolute ??
    targetNode.position ?? { x: 0, y: 0 }

  const tWidth = targetNode.measured?.width ?? 150
  const tHeight = targetNode.measured?.height ?? 80

  const cx = nPos.x + width / 2
  const cy = nPos.y + height / 2
  const tx = tPos.x + tWidth / 2
  const ty = tPos.y + tHeight / 2

  const dx = tx - cx
  const dy = ty - cy

  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return { x: cx + width / 2, y: cy }
  }

  const slope = Math.abs(dy / (dx || 0.0001))
  const cornerSlope = height / width

  if (slope <= cornerSlope) {
    // Intersects left or right edge
    const x = dx > 0 ? cx + width / 2 : cx - width / 2
    const y = cy + (dy / Math.abs(dx || 0.0001)) * (width / 2)
    return { x, y }
  } else {
    // Intersects top or bottom edge
    const y = dy > 0 ? cy + height / 2 : cy - height / 2
    const x = cx + (dx / Math.abs(dy || 0.0001)) * (height / 2)
    return { x, y }
  }
}

/**
 * Returns the position (top, right, bottom, left) of the node relative to the intersection point.
 */
export function getEdgePosition(
  node: InternalNode | { position: XYPosition; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: XYPosition } },
  intersectionPoint: XYPosition
): Position {
  const width = node.measured?.width ?? 150
  const height = node.measured?.height ?? 80
  const nPos =
    (node as any).internals?.positionAbsolute ??
    (node as any).positionAbsolute ??
    node.position ?? { x: 0, y: 0 }

  const px = intersectionPoint.x
  const py = intersectionPoint.y

  const left = nPos.x
  const right = nPos.x + width
  const top = nPos.y
  const bottom = nPos.y + height

  const dLeft = Math.abs(px - left)
  const dRight = Math.abs(px - right)
  const dTop = Math.abs(py - top)
  const dBottom = Math.abs(py - bottom)

  const minD = Math.min(dLeft, dRight, dTop, dBottom)

  if (minD === dLeft) return Position.Left
  if (minD === dRight) return Position.Right
  if (minD === dTop) return Position.Top
  return Position.Bottom
}

/**
 * Returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) needed to create a floating edge.
 */
export function getEdgeParams(
  source: InternalNode | { position: XYPosition; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: XYPosition } },
  target: InternalNode | { position: XYPosition; measured?: { width?: number; height?: number }; internals?: { positionAbsolute?: XYPosition } }
) {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  }
}
