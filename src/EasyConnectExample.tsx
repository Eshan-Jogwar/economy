import React, { useCallback } from 'react'
import '@xyflow/react/dist/style.css'
import './index.css'

import {
  Background,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  Edge,
} from '@xyflow/react'

import CustomNode from './CustomNode'
import FloatingEdge from './FloatingEdge'
import CustomConnectionLine from './CustomConnectionLine'

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 320 },
    data: { label: 'Node 2' },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 40, y: 300 },
    data: { label: 'Node 3' },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 300, y: 0 },
    data: { label: 'Node 4' },
  },
]

const initialEdges: Edge[] = []

const connectionLineStyle = {
  stroke: '#b1b1b7',
}

const nodeTypes = {
  custom: CustomNode,
}

const edgeTypes = {
  floating: FloatingEdge,
}

const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#b1b1b7',
  },
}

export const EasyConnectExample = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'floating',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#38bdf8',
            },
          },
          eds
        )
      ),
    [setEdges]
  )

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
      >
        <Background />
      </ReactFlow>
    </div>
  )
}

export default EasyConnectExample
