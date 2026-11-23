import React from 'react'
import { Handle, NodeProps, Position, useConnection } from '@xyflow/react'

export default function CustomNode({ id, data }: NodeProps) {
  const connection = useConnection()
  const isTarget = connection.inProgress && connection.fromNode?.id !== id
  const isSource = connection.inProgress && connection.fromNode?.id === id

  const displayLabel = data?.label
    ? String(data.label)
    : isTarget
    ? 'Drop here'
    : isSource
    ? 'Connecting...'
    : 'Drag to connect'

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
          backgroundColor: isTarget ? '#2a1b24' : isSource ? '#1b2234' : '#181a20',
          borderColor: isTarget ? '#f43f5e' : isSource ? '#38bdf8' : '#2d3139',
          borderWidth: isTarget ? '2px' : '1px',
          boxShadow: isTarget
            ? '0 0 12px rgba(244, 63, 94, 0.4)'
            : isSource
            ? '0 0 10px rgba(56, 189, 248, 0.35)'
            : '0 4px 6px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.15s ease',
          color: '#f8fafc',
          borderRadius: '10px',
        }}
      >
        {!connection.inProgress && (
          <Handle
            className="customHandle customHandleSource"
            position={Position.Right}
            type="source"
          />
        )}

        {(!connection.inProgress || isTarget) && (
          <Handle
            className="customHandle customHandleTarget"
            position={Position.Left}
            type="target"
            isConnectableStart={false}
          />
        )}

        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>
            {displayLabel}
          </div>
        </div>
      </div>
    </div>
  )
}
