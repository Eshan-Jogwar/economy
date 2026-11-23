import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scissors,
  Square,
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
import { getNodeIntersection } from '../utils'

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
  onDeleteNodes?: (nodeIds: string[]) => void
  onDeleteTransactions?: (txIds: string[]) => void
}

const NODE_DIMENSIONS = { width: 200, height: 80 }

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

// Helper: Check if knife line intersects straight edge line
function knifeCutsEdge(
  knifeStart: { x: number; y: number },
  knifeEnd: { x: number; y: number },
  src: { x: number; y: number },
  tgt: { x: number; y: number }
): boolean {
  return segmentsIntersect(knifeStart, knifeEnd, src, tgt)
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
  onDeleteNodes,
  onDeleteTransactions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Pan & Zoom
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [zoom, setZoom] = useState(1.0)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 })

  // Rectangle Marquee Selection Tool
  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set(selectedNodeId ? [selectedNodeId] : [])
  )
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(
    () => new Set(selectedTransactionId ? [selectedTransactionId] : [])
  )

  const [isSpacePressed, setIsSpacePressed] = useState(false)

  // Sync external selection props
  useEffect(() => {
    if (selectedNodeId) {
      setSelectedNodeIds((prev) => {
        if (prev.has(selectedNodeId) && prev.size === 1) return prev
        return new Set([selectedNodeId])
      })
    } else {
      setSelectedNodeIds((prev) => (prev.size <= 1 ? new Set() : prev))
    }
  }, [selectedNodeId])

  useEffect(() => {
    if (selectedTransactionId) {
      setSelectedTransactionIds((prev) => {
        if (prev.has(selectedTransactionId) && prev.size === 1) return prev
        return new Set([selectedTransactionId])
      })
    } else {
      setSelectedTransactionIds((prev) => (prev.size <= 1 ? new Set() : prev))
    }
  }, [selectedTransactionId])

  // Track space key for panning
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const dragStartRef = useRef<{
    mouseX: number
    mouseY: number
    initialNodeX: number
    initialNodeY: number
    initialPositions?: Record<string, { x: number; y: number }>
  }>({
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

  // Handle canvas background mouse down (Panning, Knife cutting, or Rectangle Selection)
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

    if (addMenuState.isOpen) {
      setAddMenuState((prev) => ({ ...prev, isOpen: false }))
      return
    }

    // Pan canvas on Middle Click (button 1) OR Alt+LeftClick OR Spacebar+LeftClick
    if (e.button === 1 || (e.button === 0 && (e.altKey || isSpacePressed))) {
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      }
      return
    }

    // Normal Left Click on empty canvas = Rectangle Selection Tool
    if (e.button === 0) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
      })

      if (!e.shiftKey) {
        setSelectedNodeIds(new Set())
        setSelectedTransactionIds(new Set())
        onSelectNode(null)
        onSelectTransaction(null)
      }

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

  // Start dragging a node (supports multi-node group dragging)
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodeMap.get(nodeId)
    if (!node) return

    let nodesToDrag: string[] = []
    if (selectedNodeIds.has(nodeId)) {
      nodesToDrag = Array.from(selectedNodeIds)
    } else {
      nodesToDrag = [nodeId]
      setSelectedNodeIds(new Set([nodeId]))
      setSelectedTransactionIds(new Set())
      onSelectNode(nodeId)
      onSelectTransaction(null)
    }

    setDraggingNodeId(nodeId)
    const initialPositions: Record<string, { x: number; y: number }> = {}
    nodesToDrag.forEach((id) => {
      const n = nodeMap.get(id)
      if (n) initialPositions[id] = { ...n.position }
    })

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialNodeX: node.position.x,
      initialNodeY: node.position.y,
      initialPositions,
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

      // Drag node (single or multi-selected)
      if (draggingNodeId) {
        const dx = (e.clientX - dragStartRef.current.mouseX) / zoom
        const dy = (e.clientY - dragStartRef.current.mouseY) / zoom
        const initPositions = dragStartRef.current.initialPositions
        if (initPositions && Object.keys(initPositions).length > 0) {
          Object.entries(initPositions).forEach(([id, pos]) => {
            const newX = Math.round(pos.x + dx)
            const newY = Math.round(pos.y + dy)
            onUpdateNodePosition(id, { x: newX, y: newY })
          })
        } else {
          const newX = Math.round(dragStartRef.current.initialNodeX + dx)
          const newY = Math.round(dragStartRef.current.initialNodeY + dy)
          onUpdateNodePosition(draggingNodeId, { x: newX, y: newY })
        }
      }

      // Live Rectangle Marquee Selection Dragging
      if (selectionBox) {
        const currentX = canvasPos.x
        const currentY = canvasPos.y
        setSelectionBox((prev) => (prev ? { ...prev, currentX, currentY } : null))

        const minX = Math.min(selectionBox.startX, currentX)
        const maxX = Math.max(selectionBox.startX, currentX)
        const minY = Math.min(selectionBox.startY, currentY)
        const maxY = Math.max(selectionBox.startY, currentY)

        if (maxX - minX > 2 || maxY - minY > 2) {
          const newSelectedNodes = new Set<string>(e.shiftKey ? selectedNodeIds : [])
          for (const n of nodes) {
            const nMinX = n.position.x
            const nMaxX = n.position.x + NODE_DIMENSIONS.width
            const nMinY = n.position.y
            const nMaxY = n.position.y + NODE_DIMENSIONS.height
            const overlaps = !(nMaxX < minX || nMinX > maxX || nMaxY < minY || nMinY > maxY)
            if (overlaps) {
              newSelectedNodes.add(n.id)
            }
          }

          const newSelectedTxs = new Set<string>(e.shiftKey ? selectedTransactionIds : [])
          for (const tx of transactions) {
            const sNode = nodeMap.get(tx.source)
            const tNode = nodeMap.get(tx.target)
            if (!sNode || !tNode) continue

            if (newSelectedNodes.has(tx.source) && newSelectedNodes.has(tx.target)) {
              newSelectedTxs.add(tx.id)
              continue
            }

            let sInt = getNodeIntersection(
              { position: sNode.position, measured: NODE_DIMENSIONS },
              { position: tNode.position, measured: NODE_DIMENSIONS }
            )
            let tInt = getNodeIntersection(
              { position: tNode.position, measured: NODE_DIMENSIONS },
              { position: sNode.position, measured: NODE_DIMENSIONS }
            )
            const isBidi = transactions.some(
              (o) => o.id !== tx.id && o.source === tx.target && o.target === tx.source
            )
            if (isBidi) {
              const dx = tInt.x - sInt.x
              const dy = tInt.y - sInt.y
              const len = Math.sqrt(dx * dx + dy * dy) || 1
              const offset = 12
              const nx = -dy / len
              const ny = dx / len
              sInt = { x: sInt.x + nx * offset, y: sInt.y + ny * offset }
              tInt = { x: tInt.x + nx * offset, y: tInt.y + ny * offset }
            }

            const sInside = sInt.x >= minX && sInt.x <= maxX && sInt.y >= minY && sInt.y <= maxY
            const tInside = tInt.x >= minX && tInt.x <= maxX && tInt.y >= minY && tInt.y <= maxY

            const rTopA = { x: minX, y: minY }, rTopB = { x: maxX, y: minY }
            const rRightA = { x: maxX, y: minY }, rRightB = { x: maxX, y: maxY }
            const rBottomA = { x: minX, y: maxY }, rBottomB = { x: maxX, y: maxY }
            const rLeftA = { x: minX, y: minY }, rLeftB = { x: minX, y: maxY }

            const intersectsBorder =
              segmentsIntersect(sInt, tInt, rTopA, rTopB) ||
              segmentsIntersect(sInt, tInt, rRightA, rRightB) ||
              segmentsIntersect(sInt, tInt, rBottomA, rBottomB) ||
              segmentsIntersect(sInt, tInt, rLeftA, rLeftB)

            if (sInside || tInside || intersectsBorder) {
              newSelectedTxs.add(tx.id)
            }
          }

          setSelectedNodeIds(newSelectedNodes)
          setSelectedTransactionIds(newSelectedTxs)
        }
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
          let sInt = getNodeIntersection(
            { position: sNode.position, measured: NODE_DIMENSIONS },
            { position: tNode.position, measured: NODE_DIMENSIONS }
          )
          let tInt = getNodeIntersection(
            { position: tNode.position, measured: NODE_DIMENSIONS },
            { position: sNode.position, measured: NODE_DIMENSIONS }
          )
          const isBidi = transactions.some(
            (o) => o.id !== tx.id && o.source === tx.target && o.target === tx.source
          )
          if (isBidi) {
            const dx = tInt.x - sInt.x
            const dy = tInt.y - sInt.y
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const offset = 12
            const nx = -dy / len
            const ny = dx / len
            sInt = { x: sInt.x + nx * offset, y: sInt.y + ny * offset }
            tInt = { x: tInt.x + nx * offset, y: tInt.y + ny * offset }
          }
          return knifeCutsEdge(knifeCut.startCanvas, knifeCut.endCanvas, sInt, tInt)
        })

        cutEdges.forEach((tx) => onDeleteTransaction(tx.id))
        setKnifeCut({ active: false, startCanvas: { x: 0, y: 0 }, endCanvas: { x: 0, y: 0 } })
      }

      // Marquee selection box completion
      if (selectionBox) {
        const dx = Math.abs(selectionBox.currentX - selectionBox.startX)
        const dy = Math.abs(selectionBox.currentY - selectionBox.startY)
        if (dx <= 3 && dy <= 3) {
          // Click on empty canvas without dragging: deselect all
          setSelectedNodeIds(new Set())
          setSelectedTransactionIds(new Set())
          onSelectNode(null)
          onSelectTransaction(null)
        } else {
          // If only 1 node was selected in marquee, open Inspector
          if (selectedNodeIds.size === 1) {
            const singleId = Array.from(selectedNodeIds)[0]
            onSelectNode(singleId)
            onSelectTransaction(null)
          } else if (selectedNodeIds.size === 0 && selectedTransactionIds.size === 1) {
            const singleTxId = Array.from(selectedTransactionIds)[0]
            onSelectTransaction(singleTxId)
            onSelectNode(null)
          } else {
            onSelectNode(null)
            onSelectTransaction(null)
          }
        }
        setSelectionBox(null)
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
    selectionBox,
    selectedNodeIds,
    selectedTransactionIds,
    zoom,
    screenToCanvas,
    onUpdateNodePosition,
    nodes,
    transactions,
    nodeMap,
    onRequestCreateTransaction,
    onDeleteTransaction,
    onSelectNode,
    onSelectTransaction,
  ])

  // Global Blender Keyboard Shortcuts: Shift+A, X/Delete/Backspace, Shift+D, Escape, A/Alt+A
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

      // X or Delete or Backspace = Delete selected nodes & transactions (including marquee selected items)
      if (e.key === 'x' || e.key === 'X' || e.key === 'Delete' || e.key === 'Backspace') {
        const nodeIdsToDelete = new Set(selectedNodeIds)
        if (selectedNodeId) nodeIdsToDelete.add(selectedNodeId)

        const txIdsToDelete = new Set(selectedTransactionIds)
        if (selectedTransactionId) txIdsToDelete.add(selectedTransactionId)

        if (nodeIdsToDelete.size > 0 || txIdsToDelete.size > 0) {
          e.preventDefault()

          if (onDeleteNodes) {
            onDeleteNodes(Array.from(nodeIdsToDelete))
          } else {
            nodeIdsToDelete.forEach((id) => onDeleteNode(id))
          }

          const remainingTxIds = Array.from(txIdsToDelete).filter((txId) => {
            const tx = transactions.find((t) => t.id === txId)
            if (!tx) return false
            return !nodeIdsToDelete.has(tx.source) && !nodeIdsToDelete.has(tx.target)
          })

          if (onDeleteTransactions) {
            onDeleteTransactions(remainingTxIds)
          } else {
            remainingTxIds.forEach((id) => onDeleteTransaction(id))
          }

          setSelectedNodeIds(new Set())
          setSelectedTransactionIds(new Set())
          onSelectNode(null)
          onSelectTransaction(null)
          return
        }
      }

      // Escape = Cancel wiring / dismiss menus / clear selection
      if (e.key === 'Escape') {
        setConnectingSourceId(null)
        setHoveredTargetNodeId(null)
        setAddMenuState((prev) => ({ ...prev, isOpen: false }))
        setKnifeCut({ active: false, startCanvas: { x: 0, y: 0 }, endCanvas: { x: 0, y: 0 } })
        setSelectionBox(null)
        setSelectedNodeIds(new Set())
        setSelectedTransactionIds(new Set())
        onSelectNode(null)
        onSelectTransaction(null)
        return
      }

      // A / Alt+A (Blender-style select all / deselect all)
      if ((e.key === 'a' || e.key === 'A') && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.altKey) {
          e.preventDefault()
          setSelectedNodeIds(new Set())
          setSelectedTransactionIds(new Set())
          onSelectNode(null)
          onSelectTransaction(null)
        } else {
          e.preventDefault()
          setSelectedNodeIds(new Set(nodes.map((n) => n.id)))
          setSelectedTransactionIds(new Set(transactions.map((t) => t.id)))
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNodeId,
    selectedTransactionId,
    selectedNodeIds,
    selectedTransactionIds,
    nodes,
    transactions,
    onDeleteNode,
    onDeleteNodes,
    onDeleteTransaction,
    onDeleteTransactions,
    onDuplicateNode,
    onSelectNode,
    onSelectTransaction,
    screenToCanvas,
  ])

  // Live Dynamic Floating Rubber-Band Wire with Directional Flow Arrow
  let rubberBandPath = ''
  let rubberBandTgt = { x: 0, y: 0 }
  let rubberBandAngle = 0
  let rubberBandMid = { x: 0, y: 0 }
  let rubberBandMidAngle = 0

  if (connectingSourceId) {
    const srcNode = nodeMap.get(connectingSourceId)
    if (srcNode) {
      const targetPos = hoveredTargetNodeId
        ? nodeMap.get(hoveredTargetNodeId)?.position || mouseCanvasPos
        : mouseCanvasPos
      const targetDim = hoveredTargetNodeId ? NODE_DIMENSIONS : { width: 10, height: 10 }

      const srcIntersection = getNodeIntersection(
        { position: srcNode.position, measured: NODE_DIMENSIONS },
        { position: targetPos, measured: targetDim }
      )

      let tgtX = mouseCanvasPos.x
      let tgtY = mouseCanvasPos.y

      if (hoveredTargetNodeId) {
        const hNode = nodeMap.get(hoveredTargetNodeId)
        if (hNode) {
          const tgtIntersection = getNodeIntersection(
            { position: hNode.position, measured: NODE_DIMENSIONS },
            { position: srcNode.position, measured: NODE_DIMENSIONS }
          )
          tgtX = tgtIntersection.x
          tgtY = tgtIntersection.y
        }
      }

      const srcX = srcIntersection.x
      const srcY = srcIntersection.y

      rubberBandPath = `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`
      rubberBandTgt = { x: tgtX, y: tgtY }
      rubberBandAngle = Math.atan2(tgtY - srcY, tgtX - srcX) * (180 / Math.PI)
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
          : isSpacePressed
          ? 'grab'
          : knifeCut.active
          ? 'crosshair'
          : connectingSourceId
          ? 'crosshair'
          : selectionBox
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
        {/* SVG Layer: Grid, Edges, Connecting Wire, Particles, Knife Line, Selection Marquee */}
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

            const isBidirectional = transactions.some(
              (other) =>
                other.id !== tx.id &&
                other.source === tx.target &&
                other.target === tx.source
            )

            return (
              <EdgeView
                key={tx.id}
                transaction={tx}
                sourceNode={srcNode}
                targetNode={tgtNode}
                currencies={currencies}
                selected={selectedTransactionIds.has(tx.id) || selectedTransactionId === tx.id}
                isBidirectional={isBidirectional}
                onSelect={() => {
                  setSelectedTransactionIds(new Set([tx.id]))
                  setSelectedNodeIds(new Set())
                  onSelectTransaction(tx.id)
                  onSelectNode(null)
                }}
                nodeDimensions={NODE_DIMENSIONS}
              />
            )
          })}

          {/* Live Easy Connect Straight Wire with Arrowhead */}
          {connectingSourceId && rubberBandPath && (
            <g pointerEvents="none">
              {/* Outer glow */}
              <path
                d={rubberBandPath}
                stroke={hoveredTargetNodeId ? '#34d399' : '#38bdf8'}
                strokeWidth={5}
                strokeOpacity={0.25}
                fill="none"
              />
              {/* Straight wire */}
              <path
                d={rubberBandPath}
                stroke={hoveredTargetNodeId ? '#34d399' : '#38bdf8'}
                strokeWidth={2}
                strokeDasharray={hoveredTargetNodeId ? undefined : '5,5'}
                fill="none"
              />
              {/* Directional Arrowhead pointing at target endpoint */}
              <g transform={`translate(${rubberBandTgt.x}, ${rubberBandTgt.y}) rotate(${rubberBandAngle})`}>
                <polygon
                  points="-10,-5 0,0 -10,5 -7,0"
                  fill={hoveredTargetNodeId ? '#34d399' : '#38bdf8'}
                />
              </g>
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

          {/* Rectangle Selection Marquee Box */}
          {selectionBox && (
            <g pointerEvents="none" className="selection-marquee" data-testid="selection-marquee">
              <rect
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill="rgba(56, 189, 248, 0.14)"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4,3"
                rx={2}
              />
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
                selected={selectedNodeIds.has(node.id) || selectedNodeId === node.id}
                isConnectingSource={connectingSourceId === node.id}
                isPotentialTarget={connectingSourceId !== null && connectingSourceId !== node.id}
                isHoveredTarget={connectingSourceId !== null && connectingSourceId !== node.id && hoveredTargetNodeId === node.id}
                viewCurrencyId={viewCurrencyId}
                onSelect={() => {
                  setSelectedNodeIds(new Set([node.id]))
                  setSelectedTransactionIds(new Set())
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

        <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 2px' }} />

        {/* Box Select tool hint indicator */}
        <div
          title="Box Select: Click and drag on canvas to select multiple nodes & edges. Press Delete or Backspace to delete."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
            fontSize: '10px',
            color: '#38bdf8',
          }}
        >
          <Square size={12} />
          <span>Box Select</span>
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
