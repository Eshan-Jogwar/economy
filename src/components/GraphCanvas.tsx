import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Unlink,
  X,
  Building2,
  Landmark,
  UserCheck,
  Coins,
  Flame,
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

interface GraphCanvasProps {
  nodes: SimulationNode[]
  transactions: SimulationTransaction[]
  currencies: Currency[]
  recentEvents: TransactionExecutionEvent[]
  selectedNodeId: string | null
  selectedTransactionId: string | null
  onSelectNode: (nodeId: string | null) => void
  onSelectTransaction: (txId: string | null) => void
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  onAddNode: (role: NodeRole, label: string) => void
  onDeleteNode: (nodeId: string) => void
  onCreateTransaction: (sourceId: string, targetId: string) => void
  onDeleteTransaction: (txId: string) => void
}

const NODE_DIMENSIONS = { width: 220, height: 130 }

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  transactions,
  currencies,
  recentEvents,
  selectedNodeId,
  selectedTransactionId,
  onSelectNode,
  onSelectTransaction,
  onUpdateNodePosition,
  onAddNode,
  onDeleteNode,
  onCreateTransaction,
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

  // Connection Drawing
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null)
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Add Node Menu dropdown
  const [showAddMenu, setShowAddMenu] = useState(false)

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

  // Handle canvas background mouse down (start panning)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
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

  // Start connecting from a node
  const handleStartConnect = (nodeId: string) => {
    setConnectingSourceId(nodeId)
    onSelectNode(nodeId)
    onSelectTransaction(null)
  }

  // Complete connection to a target node
  const handleCompleteConnect = (targetNodeId: string) => {
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
      onCreateTransaction(connectingSourceId, targetNodeId)
    }
    setConnectingSourceId(null)
  }

  // Window mouse move & up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectingSourceId) {
        setMouseCanvasPos(screenToCanvas(e.clientX, e.clientY))
      }

      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setPan({
          x: panStartRef.current.initialPanX + dx,
          y: panStartRef.current.initialPanY + dy,
        })
      }

      if (draggingNodeId) {
        const dx = (e.clientX - dragStartRef.current.mouseX) / zoom
        const dy = (e.clientY - dragStartRef.current.mouseY) / zoom
        const newX = Math.round(dragStartRef.current.initialNodeX + dx)
        const newY = Math.round(dragStartRef.current.initialNodeY + dy)
        onUpdateNodePosition(draggingNodeId, { x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
      setDraggingNodeId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, draggingNodeId, connectingSourceId, zoom, screenToCanvas, onUpdateNodePosition])

  // Keyboard shortcut listeners (Delete / Backspace / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      if (e.key === 'Escape') {
        setConnectingSourceId(null)
        onSelectNode(null)
        onSelectTransaction(null)
        setShowAddMenu(false)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          onDeleteNode(selectedNodeId)
          onSelectNode(null)
        } else if (selectedTransactionId) {
          onDeleteTransaction(selectedTransactionId)
          onSelectTransaction(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNodeId,
    selectedTransactionId,
    onDeleteNode,
    onDeleteTransaction,
    onSelectNode,
    onSelectTransaction,
  ])

  // Rubber-band line coords when connecting
  let rubberBandPath = ''
  if (connectingSourceId) {
    const srcNode = nodeMap.get(connectingSourceId)
    if (srcNode) {
      const srcX = srcNode.position.x + NODE_DIMENSIONS.width
      const srcY = srcNode.position.y + NODE_DIMENSIONS.height / 2
      rubberBandPath = `M ${srcX} ${srcY} L ${mouseCanvasPos.x} ${mouseCanvasPos.y}`
    }
  }

  return (
    <div
      ref={containerRef}
      className="graph-canvas-container"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#090d16',
        cursor: isPanning ? 'grabbing' : connectingSourceId ? 'crosshair' : 'default',
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
        {/* SVG Layer */}
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

          {/* Directed Edges */}
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

          {/* Active Connecting Rubber-Band Line */}
          {connectingSourceId && rubberBandPath && (
            <path
              d={rubberBandPath}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4,4"
              fill="none"
              pointerEvents="none"
            />
          )}

          {/* Animated Particles */}
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
        {/* Add Node Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button
            title="Add Node"
            onClick={() => setShowAddMenu(!showAddMenu)}
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
          </button>

          {showAddMenu && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: '36px',
                width: '160px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 60,
              }}
            >
              {[
                { role: 'agent' as NodeRole, label: 'Agent', icon: UserCheck, color: '#38bdf8' },
                { role: 'market' as NodeRole, label: 'Market / Exchange', icon: Building2, color: '#a78bfa' },
                { role: 'bank' as NodeRole, label: 'Central Bank', icon: Landmark, color: '#fbbf24' },
                { role: 'mint' as NodeRole, label: 'Mint / Source', icon: Coins, color: '#34d399' },
                { role: 'sink' as NodeRole, label: 'Drain / Sink', icon: Flame, color: '#f87171' },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    onAddNode(item.role, item.label)
                    setShowAddMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    backgroundColor: 'transparent',
                    color: '#f8fafc',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <item.icon size={14} color={item.color} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 2px' }} />

        {/* Zoom Controls */}
        <button
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          style={{
            padding: '6px',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <ZoomIn size={14} />
        </button>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', minWidth: '38px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.35))}
          style={{
            padding: '6px',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <ZoomOut size={14} />
        </button>
        <button
          title="Reset View"
          onClick={() => {
            setZoom(1.0)
            setPan({ x: 40, y: 40 })
          }}
          style={{
            padding: '6px',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Connection Mode Banner */}
      {connectingSourceId && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: '#0f172a',
            border: '1px solid #38bdf8',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 500,
            zIndex: 60,
          }}
        >
          <Unlink size={14} color="#38bdf8" />
          <span>Click a target node to complete transaction connection</span>
          <button
            onClick={() => setConnectingSourceId(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              marginLeft: '4px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
