import React from 'react'
import { Handle, NodeProps, Position, useConnection } from '@xyflow/react'

export default function CustomNode({ id, data }: NodeProps) {
  const connection = useConnection()
  const isTarget = connection.inProgress && connection.fromNode?.id !== id
  const isSource = connection.inProgress && connection.fromNode?.id === id

  const displayLabel = data?.label
    ? String(data.label)
    : isTarget
    ? 'Drop here to connect'
    : isSource
    ? 'Connecting...'
    : `Node ${id}`

  return (
    <div
      className={`customNode ${isTarget ? 'customNodeTarget' : ''} ${
        isSource ? 'customNodeSource' : ''
      }`}
      style={{ position: 'relative' }}
    >
      <div
        className="customNodeBody"
        style={{
          borderStyle: isTarget ? 'dashed' : 'solid',
          backgroundColor: isTarget ? '#ffcce3' : isSource ? '#e0e7ff' : '#ccd9f6',
          borderColor: isTarget ? '#e11d48' : isSource ? '#4f46e5' : '#222138',
          borderWidth: isTarget ? '3px' : '2px',
          boxShadow: isTarget
            ? '0 0 12px rgba(225, 29, 72, 0.4)'
            : isSource
            ? '0 0 10px rgba(79, 70, 229, 0.35)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Source Handle: renders when not connecting so dragging anywhere from node connects */}
        {!connection.inProgress && (
          <Handle
            className="customHandle customHandleSource"
            position={Position.Right}
            type="source"
          />
        )}

        {/* Target Handle: renders when not connecting or when this is an eligible target */}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="customHandle customHandleTarget"
            position={Position.Left}
            type="target"
            isConnectableStart={false}
          />
        )}

        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
            {displayLabel}
          </div>
          {!connection.inProgress && (
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              Drag to connect ➔
            </div>
          )}
          {isTarget && (
            <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: 600, marginTop: '2px' }}>
              ▼ Drop here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
