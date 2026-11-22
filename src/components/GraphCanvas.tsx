import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scissors,
  HelpCircle,
} from 'lucide-react'
import {
  SimulationNode,
  SimulationTransaction,
  Currency,
  TransactionExecutionEvent,
  NodeRole,
} from '../types/simulation'
import { NodeView } from './NodeView'
import { EdgeView } from './EdgeView'
import { ParticleLayer } from './ParticleLayer'
import { AddNodeMenu } from './AddNodeMenu'

interface GraphCanvasProps {
  nodes: SimulationNode[]
  transactions: SimulationTransaction[]
  currencies: Currency[]
  recentEvents: TransactionExecutionEvent[]
  selectedNodeId: string | null
  selectedTransactionId: string | null
  viewCurrencyId?: string
  onSelectNode: (nodeId: string | null) => void
  onSelectTransaction: (txId: string | null) => void
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  onRequestCreateNode: (role: NodeRole, position: { x: number; y: number }) => void
  onDeleteNode: (nodeId: string) => void
  onDuplicateNode?: (nodeId: string) => void
  onRequestCreateTransaction: (sourceId: string, targetId: string) => void
  onDeleteTransaction: (txId: string) => void
}

const NODE_DIMENSIONS = { width: 220, height: 130 }

// Helper: 2D line segment orientation
function ccw(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): boolean {
  return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)
}

// Helper: 2D line segments intersection check
function segmentsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number }
): boolean {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
}

// Helper: Check if knife line intersects cubic Bezier edge
function knifeCutsEdge(
  knifeStart: { x: number; y: number },
  knifeEnd: { x: number; y: number },
  src: { x: number; y: number },
  tgt: { x: number; y: number }
): boolean {
  const srcX = src.x + NODE_DIMENSIONS.width
  const srcY = src.y + NODE_DIMENSIONS.height / 2
  const tgtX = tgt.x
  const tgtY = tgt.y + NODE_DIMENSIONS.height / 2

  const dx = Math.max(Math.abs(tgtX - srcX) * 0.55, 60)
  const ctrl1X = srcX + dx
  const ctrl1Y = srcY
  const ctrl2X = tgtX - dx
  const ctrl2Y = tgtY

  // Sample 8 points along the cubic bezier
  const samples: { x: number; y: number }[] = []
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const invT = 1 - t
    const x =
      invT * invT * invT * srcX +
      3 * invT * invT * t * ctrl1X +
      3 * invT * t * t * ctrl2X +
      t * t * t * tgtX
    const y =
      invT * invT * invT * srcY +
      3 * invT * invT * t * ctrl1Y +
      3 * invT * t * t * ctrl2Y +
      t * t * t * tgtY
    samples.push({ x, y })
  }

  for (let i = 0; i < samples.length - 1; i++) {
    if (segmentsIntersect(knifeStart, knifeEnd, samples[i], samples[i + 1])) {
      return true
    }
  }

  return false
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  transactions,
  currencies,
  recentEvents,
  selectedNodeId,
  selectedTransactionId,
  viewCurrencyId = 'native',
  onSelectNode,
  onSelectTransaction,
  onUpdateNodePosition,
  onRequestCreateNode,
  onDeleteNode,
  onDuplicateNode,
  onRequestCreateTransaction,
  onDeleteTransaction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Pan & Zoom
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [zoom, setZoom] = useState(1.0)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 })

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    initialNodeX: 0,
    initialNodeY: 0,
  })

  // Blender Connection Dragging
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null)
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null)

  // Blender Add Node Menu (Shift+A or Right-Click)
  const [addMenuState, setAddMenuState] = useState<{
    isOpen: boolean
    screenPos: { x: number; y: number }
    canvasPos: { x: number; y: number }
  }>({
    isOpen: false,
    screenPos: { x: 200, y: 200 },
    canvasPos: { x: 300, y: 250 },
  })

  // Blender Knife Tool (Ctrl + Right Click Drag)
  const [knifeCut, setKnifeCut] = useState<{
    active: boolean
    startCanvas: { x: number; y: number }
    endCanvas: { x: number; y: number }
  }>({
    active: false,
    startCanvas: { x: 0, y: 0 },
    endCanvas: { x: 0, y: 0 },
  })

  // Track latest mouse screen position for Shift+A placement
  const lastMousePosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 400, clientY: 300 })

  // Map of node positions
  const nodePositionMap: Record<string, { x: number; y: number }> = {}
  const nodeMap = new Map<string, SimulationNode>()
  nodes.forEach((n) => {
    nodePositionMap[n.id] = n.position
    nodeMap.set(n.id, n)
  })

  // Convert screen coordinates to canvas space
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 }
      const rect = containerRef.current.getBoundingClientRect()
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [pan, zoom]
  )

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.5)

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    }
  }

  // Handle canvas background mouse down (Panning or Knife cutting)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY }

    // Ctrl + Right Click = Knife Cutter Tool
    if (e.button === 2 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      setKnifeCut({
        active: true,
        startCanvas: canvasPos,
        endCanvas: canvasPos,
      })
      return
    }

    // Normal Left Click or Middle Click = Canvas Pan & Deselect
    if (e.button === 0 || e.button === 1) {
      if (addMenuState.isOpen) {
        setAddMenuState((prev) => ({ ...prev, isOpen: false }))
        return
      }
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      }
      onSelectNode(null)
      onSelectTransaction(null)
      if (connectingSourceId) {
        setConnectingSourceId(null)
      }
    }
  }

  // Right Click on Canvas: Open Add Node Menu if not Knife cutting
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Handled by knife cutter
      return
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    setAddMenuState({
      isOpen: true,
      screenPos: { x: e.clientX, y: e.clientY },
      canvasPos,
    })
  }

  // Start dragging a node
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodeMap.get(nodeId)
    if (!node) return

    setDraggingNodeId(nodeId)
    onSelectNode(nodeId)
    onSelectTransaction(null)

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialNodeX: node.position.x,
      initialNodeY: node.position.y,
    }
  }

  // Start connecting wire from an output socket
  const handleStartConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setConnectingSourceId(nodeId)
    onSelectNode(nodeId)
    onSelectTransaction(null)
    setMouseCanvasPos(screenToCanvas(e.clientX, e.clientY))
  }

  // Complete connection to a target node: triggers CreateEdgeModal
  const handleCompleteConnect = (targetNodeId: string) => {
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
      onRequestCreateTransaction(connectingSourceId, targetNodeId)
    }
    setConnectingSourceId(null)
    setHoveredTargetNodeId(null)
  }

  // Open Add Node Menu via toolbar or hotkey
  const handleOpenAddMenu = (screenPos?: { x: number; y: number }, canvasPos?: { x: number; y: number }) => {
    const sPos = screenPos || { x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 180 }
    const cPos = canvasPos || screenToCanvas(sPos.x, sPos.y)
    setAddMenuState({
      isOpen: true,
      screenPos: sPos,
      canvasPos: cPos,
    })
  }

  // When role is selected from AddNodeMenu: triggers CreateNodeModal
  const handleSelectRoleFromAddMenu = (role: NodeRole) => {
    const targetPos = addMenuState.canvasPos
    setAddMenuState((prev) => ({ ...prev, isOpen: false }))
    onRequestCreateNode(role, targetPos)
  }

  // Window mouse move & up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY }
      const canvasPos = screenToCanvas(e.clientX, e.clientY)

      // Live wire dragging
      if (connectingSourceId) {
        setMouseCanvasPos(canvasPos)

        // Check which node cursor is currently hovering over
        let foundHover: string | null = null
        for (const n of nodes) {
          if (n.id === connectingSourceId) continue
          const inX = canvasPos.x >= n.position.x - 20 && canvasPos.x <= n.position.x + NODE_DIMENSIONS.width + 20
          const inY = canvasPos.y >= n.position.y - 10 && canvasPos.y <= n.position.y + NODE_DIMENSIONS.height + 10
          if (inX && inY) {
            foundHover = n.id
            break
          }
        }
        setHoveredTargetNodeId(foundHover)
      }

      // Knife tool dragging
      if (knifeCut.active) {
        setKnifeCut((prev) => ({
          ...prev,
          endCanvas: canvasPos,
        }))
      }

      // Pan canvas
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setPan({
          x: panStartRef.current.initialPanX + dx,
          y: panStartRef.current.initialPanY + dy,
        })
      }

      // Drag node
      if (draggingNodeId) {
        const dx = (e.clientX - dragStartRef.current.mouseX) / zoom
        const dy = (e.clientY - dragStartRef.current.mouseY) / zoom
        const newX = Math.round(dragStartRef.current.initialNodeX + dx)
        const newY = Math.round(dragStartRef.current.initialNodeY + dy)
        onUpdateNodePosition(draggingNodeId, { x: newX, y: newY })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      setIsPanning(false)
      setDraggingNodeId(null)

      // Knife tool completion: sever any intersecting edges!
      if (knifeCut.active) {
        const cutEdges = transactions.filter((tx) => {
          const sNode = nodeMap.get(tx.source)
          const tNode = nodeMap.get(tx.target)
          if (!sNode || !tNode) return false
          return knifeCutsEdge(knifeCut.startCanvas, knifeCut.endCanvas, sNode.position, tNode.position)
        })

        cutEdges.forEach((tx) => onDeleteTransaction(tx.id))
        setKnifeCut({ active: false, startCanvas: { x: 0, y: 0 }, endCanvas: { x: 0, y: 0 } })
      }

      // If dragging a connection and released over empty canvas
      if (connectingSourceId) {
        if (hoveredTargetNodeId && hoveredTargetNodeId !== connectingSourceId) {
          onRequestCreateTransaction(connectingSourceId, hoveredTargetNodeId)
        }
        setConnectingSourceId(null)
        setHoveredTargetNodeId(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isPanning,
    draggingNodeId,
    connectingSourceId,
    hoveredTargetNodeId,
    knifeCut,
    zoom,
    screenToCanvas,
    onUpdateNodePosition,
    nodes,
    transactions,
    nodeMap,
    onRequestCreateTransaction,
    onDeleteTransaction,
  ])

  // Global Blender Keyboard Shortcuts: Shift+A, X/Delete, Shift+D, Escape, A/Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      // Shift + A = Open Add Node Menu at mouse cursor
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        const mouseX = lastMousePosRef.current.clientX
        const mouseY = lastMousePosRef.current.clientY
        const canvasPos = screenToCanvas(mouseX, mouseY)
        setAddMenuState({
          isOpen: true,
          screenPos: { x: mouseX, y: mouseY },
          canvasPos,
        })
        return
      }

      // Shift + D = Duplicate selected node
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        if (selectedNodeId && onDuplicateNode) {
          e.preventDefault()
          onDuplicateNode(selectedNodeId)
          return
        }
      }

      // X or Delete = Delete selected node or transaction
      if (e.key === 'x' || e.key === 'X' || e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault()
          onDeleteNode(selectedNodeId)
          onSelectNode(null)
        } else if (selectedTransactionId) {
          e.preventDefault()
          onDeleteTransaction(selectedTransactionId)
          onSelectTransaction(null)
        }
        return
      }

      // Escape = Cancel wiring / dismiss menus / deselect
      if (e.key === 'Escape') {
        setConnectingSourceId(null)
        setHoveredTargetNodeId(null)
        setAddMenuState((prev) => ({ ...prev, isOpen: false }))
        setKnifeCut({ active: false, startCanvas: { x: 0, y: 0 }, endCanvas: { x: 0, y: 0 } })
        onSelectNode(null)
        onSelectTransaction(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNodeId,
    selectedTransactionId,
    onDeleteNode,
    onDeleteTransaction,
    onDuplicateNode,
    onSelectNode,
    onSelectTransaction,
    screenToCanvas,
  ])

  // Live Cubic Bezier Rubber-Band Wire while connecting
  let rubberBandPath = ''
  if (connectingSourceId) {
    const srcNode = nodeMap.get(connectingSourceId)
    if (srcNode) {
      const srcX = srcNode.position.x + NODE_DIMENSIONS.width
      const srcY = srcNode.position.y + NODE_DIMENSIONS.height / 2

      let tgtX = mouseCanvasPos.x
      let tgtY = mouseCanvasPos.y

      // Snap to hovered target node input socket if hovering over one
      if (hoveredTargetNodeId) {
        const hNode = nodeMap.get(hoveredTargetNodeId)
        if (hNode) {
          tgtX = hNode.position.x
          tgtY = hNode.position.y + NODE_DIMENSIONS.height / 2
        }
      }

      const dx = Math.max(Math.abs(tgtX - srcX) * 0.55, 50)
      const ctrl1X = srcX + dx
      const ctrl1Y = srcY
      const ctrl2X = tgtX - dx
      const ctrl2Y = tgtY

      rubberBandPath = `M ${srcX} ${srcY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${tgtX} ${tgtY}`
    }
  }

  return (
    <div
      ref={containerRef}
      className="graph-canvas-container"
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#090d16',
        cursor: isPanning
          ? 'grabbing'
          : knifeCut.active
          ? 'crosshair'
          : connectingSourceId
          ? 'crosshair'
          : 'default',
        userSelect: 'none',
      }}
    >
      {/* Canvas Transform Layer */}
      <div
        className="canvas-transform-layer"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Layer: Grid, Edges, Connecting Wire, Particles, Knife Line */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '6000px',
            height: '6000px',
            overflow: 'visible',
            pointerEvents: 'auto',
          }}
        >
          <defs>
            <pattern
              id="canvas-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="#1e293b" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect
            x="-2000"
            y="-2000"
            width="8000"
            height="8000"
            fill="url(#canvas-grid)"
            pointerEvents="none"
          />

          {/* Directed Transaction Edges */}
          {transactions.map((tx) => {
            const srcNode = nodeMap.get(tx.source)
            const tgtNode = nodeMap.get(tx.target)
            if (!srcNode || !tgtNode) return null

            return (
              <EdgeView
                key={tx.id}
                transaction={tx}
                sourceNode={srcNode}
                targetNode={tgtNode}
                currencies={currencies}
                selected={selectedTransactionId === tx.id}
                onSelect={() => {
                  onSelectTransaction(tx.id)
                  onSelectNode(null)
                }}
                nodeDimensions={NODE_DIMENSIONS}
              />
            )
          })}

          {/* Live Blender-Style Cubic Bezier Connecting Wire */}
          {connectingSourceId && rubberBandPath && (
            <g pointerEvents="none">
              {/* Outer glow */}
              <path
                d={rubberBandPath}
                stroke="#38bdf8"
                strokeWidth={5}
                strokeOpacity={0.3}
                fill="none"
              />
              {/* Core wire */}
              <path
                d={rubberBandPath}
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeDasharray={hoveredTargetNodeId ? undefined : '5,5'}
                fill="none"
              />
              {/* Target socket snap circle */}
              <circle
                cx={hoveredTargetNodeId ? nodeMap.get(hoveredTargetNodeId)?.position.x : mouseCanvasPos.x}
                cy={hoveredTargetNodeId ? (nodeMap.get(hoveredTargetNodeId)?.position.y ?? 0) + NODE_DIMENSIONS.height / 2 : mouseCanvasPos.y}
                r={hoveredTargetNodeId ? 8 : 4}
                fill={hoveredTargetNodeId ? '#34d399' : '#38bdf8'}
              />
            </g>
          )}

          {/* Blender Knife Tool Laser Cutter Line */}
          {knifeCut.active && (
            <g pointerEvents="none">
              <line
                x1={knifeCut.startCanvas.x}
                y1={knifeCut.startCanvas.y}
                x2={knifeCut.endCanvas.x}
                y2={knifeCut.endCanvas.y}
                stroke="#f43f5e"
                strokeWidth={4}
                strokeOpacity={0.4}
              />
              <line
                x1={knifeCut.startCanvas.x}
                y1={knifeCut.startCanvas.y}
                x2={knifeCut.endCanvas.x}
                y2={knifeCut.endCanvas.y}
                stroke="#ff4d4d"
                strokeWidth={2}
                strokeDasharray="4,2"
              />
              <circle cx={knifeCut.startCanvas.x} cy={knifeCut.startCanvas.y} r={3} fill="#ff4d4d" />
              <circle cx={knifeCut.endCanvas.x} cy={knifeCut.endCanvas.y} r={3} fill="#ff4d4d" />
            </g>
          )}

          {/* Animated Flow Particles */}
          <ParticleLayer
            events={recentEvents}
            currencies={currencies}
            nodePositions={nodePositionMap}
            nodeDimensions={NODE_DIMENSIONS}
          />
        </svg>

        {/* HTML Layer: Nodes */}
        <div
          className="nodes-container"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none',
          }}
        >
          {nodes.map((node) => (
            <div key={node.id} style={{ pointerEvents: 'auto' }}>
              <NodeView
                node={node}
                currencies={currencies}
                selected={selectedNodeId === node.id}
                isConnectingSource={connectingSourceId === node.id}
                isPotentialTarget={connectingSourceId !== null && connectingSourceId !== node.id && hoveredTargetNodeId === node.id}
                viewCurrencyId={viewCurrencyId}
                onSelect={() => {
                  onSelectNode(node.id)
                  onSelectTransaction(null)
                }}
                onStartConnect={handleStartConnect}
                onCompleteConnect={
                  connectingSourceId && connectingSourceId !== node.id
                    ? handleCompleteConnect
                    : undefined
                }
                onDragStart={handleNodeDragStart}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Canvas Controls Toolbar */}
      <div
        className="canvas-floating-toolbar"
        style={{
          position: 'absolute',
          left: '16px',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 50,
        }}
      >
        {/* Add Node Button (triggers Blender Add Node Menu) */}
        <button
          title="Add Node (Shift + A)"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            handleOpenAddMenu({ x: rect.left, y: rect.top - 360 })
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            fontWeight: 600,
            fontSize: '12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>Add Node</span>
          <span
            style={{
              fontSize: '9px',
              backgroundColor: 'rgba(15, 23, 42, 0.25)',
              padding: '1px 4px',
              borderRadius: '3px',
            }}
          >
            Shift+A
          </span>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 2px' }} />

        {/* Zoom Controls */}
        <button
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(z * 1.15, 2.5))}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ZoomIn size={14} />
        </button>

        <button
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(z / 1.15, 0.35))}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ZoomOut size={14} />
        </button>

        <button
          title="Reset Zoom & Pan"
          onClick={() => {
            setZoom(1.0)
            setPan({ x: 40, y: 40 })
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <RotateCcw size={14} />
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 2px' }} />

        {/* Knife tool hint indicator */}
        <div
          title="Knife Tool: Hold Ctrl and drag Right Mouse Button to cut wires"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
            fontSize: '10px',
            color: '#64748b',
          }}
        >
          <Scissors size={12} />
          <span>Ctrl+RMB Cut</span>
        </div>
      </div>

      {/* Blender-style Add Node Search Menu */}
      <AddNodeMenu
        isOpen={addMenuState.isOpen}
        screenPosition={addMenuState.screenPos}
        onSelectRole={handleSelectRoleFromAddMenu}
        onClose={() => setAddMenuState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
