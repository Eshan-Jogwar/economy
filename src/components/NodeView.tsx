import React from 'react'
import {
  Building2,
  Landmark,
  UserCheck,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  GripHorizontal,
} from 'lucide-react'
import { SimulationNode, Currency, NodeRole } from '../types/simulation'

interface NodeViewProps {
  node: SimulationNode
  currencies: Currency[]
  selected?: boolean
  isConnectingSource?: boolean
  isPotentialTarget?: boolean
  onSelect: () => void
  onStartConnect: (e: React.MouseEvent, nodeId: string) => void
  onCompleteConnect?: (nodeId: string) => void
  onDragStart: (e: React.MouseEvent, nodeId: string) => void
}

const getRoleConfig = (role: NodeRole) => {
  switch (role) {
    case 'agent':
      return { label: 'Agent', icon: UserCheck, color: '#38bdf8' }
    case 'market':
      return { label: 'Market', icon: Building2, color: '#a78bfa' }
    case 'bank':
      return { label: 'Bank', icon: Landmark, color: '#fbbf24' }
    case 'mint':
      return { label: 'Mint', icon: Coins, color: '#34d399' }
    case 'sink':
      return { label: 'Sink', icon: Flame, color: '#f87171' }
  }
}

export const NodeView: React.FC<NodeViewProps> = ({
  node,
  currencies,
  selected = false,
  isConnectingSource = false,
  isPotentialTarget = false,
  onSelect,
  onStartConnect,
  onCompleteConnect,
  onDragStart,
}) => {
  const roleConfig = getRoleConfig(node.role)
  const RoleIcon = roleConfig.icon

  // Currency lookup map
  const currencyMap = new Map<string, Currency>()
  currencies.forEach((c) => currencyMap.set(c.id, c))

  // Determine non-zero or tracked currencies
  const balanceEntries = Object.entries(node.balances)
    .filter(([_, bal]) => bal !== 0 || currencies.length <= 3)
    .slice(0, 4)

  return (
    <div
      className={`node-card ${selected ? 'node-selected' : ''} ${
        isConnectingSource ? 'node-connecting-source' : ''
      } ${isPotentialTarget ? 'node-potential-target' : ''}`}
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: '220px',
        minHeight: '120px',
        backgroundColor: '#0f172a',
        border: selected
          ? '2px solid #38bdf8'
          : isPotentialTarget
          ? '2px dashed #34d399'
          : isConnectingSource
          ? '2px solid #f59e0b'
          : '1px solid #334155',
        borderRadius: '8px',
        boxShadow: selected
          ? '0 0 0 3px rgba(56, 189, 248, 0.25), 0 8px 16px rgba(0,0,0,0.5)'
          : isPotentialTarget
          ? '0 0 0 3px rgba(52, 211, 153, 0.3), 0 8px 16px rgba(0,0,0,0.5)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        color: '#f8fafc',
        userSelect: 'none',
        zIndex: selected || isPotentialTarget ? 25 : 10,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (onCompleteConnect) {
          onCompleteConnect(node.id)
        } else {
          onSelect()
        }
      }}
      onMouseUp={() => {
        if (onCompleteConnect) {
          onCompleteConnect(node.id)
        }
      }}
    >
      {/* Blender-style Input Socket (Left Side - Target Receiver) */}
      <div
        className="blender-socket blender-socket-input"
        title="Input Socket: Drop wire here to connect"
        onClick={(e) => {
          e.stopPropagation()
          if (onCompleteConnect) {
            onCompleteConnect(node.id)
          }
        }}
        onMouseUp={(e) => {
          e.stopPropagation()
          if (onCompleteConnect) {
            onCompleteConnect(node.id)
          }
        }}
        style={{
          position: 'absolute',
          left: '-9px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: isPotentialTarget ? '#34d399' : '#0f172a',
          border: isPotentialTarget ? '2px solid #ffffff' : '2px solid #94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onCompleteConnect ? 'pointer' : 'default',
          zIndex: 30,
          boxShadow: isPotentialTarget
            ? '0 0 8px #34d399, inset 0 0 4px #34d399'
            : '0 2px 4px rgba(0,0,0,0.6)',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isPotentialTarget ? '#ffffff' : '#64748b',
          }}
        />
      </div>

      {/* Node Header */}
      <div
        className="node-header"
        onMouseDown={(e) => onDragStart(e, node.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: isConnectingSource ? 'rgba(245, 158, 11, 0.15)' : '#1e293b',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          cursor: 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RoleIcon size={15} color={roleConfig.color} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 600,
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: `${roleConfig.color}22`,
              color: roleConfig.color,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {roleConfig.label}
          </span>
          <GripHorizontal size={14} color="#64748b" />
        </div>
      </div>

      {/* Balances Section */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontSize: '10px',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          Balances
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {balanceEntries.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              0 balances
            </div>
          ) : (
            balanceEntries.map(([currId, amount]) => {
              const cur = currencyMap.get(currId)
              const color = cur?.color || '#94a3b8'
              const symbol = cur?.symbol || currId
              return (
                <div
                  key={currId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: color,
                      }}
                    />
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>{cur?.name || currId}</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color }}>
                    {amount.toLocaleString(undefined, {
                      minimumFractionDigits: cur?.decimals ?? 2,
                      maximumFractionDigits: cur?.decimals ?? 2,
                    })}{' '}
                    {symbol}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Node Rule Badge (if active) */}
        {node.rule && node.rule.type !== 'none' && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
            }}
          >
            {node.rule.type === 'mint' ? (
              <>
                <PlusCircle size={12} color="#34d399" />
                <span style={{ color: '#34d399' }}>
                  +{node.rule.amount} {currencyMap.get(node.rule.currencyId)?.symbol || node.rule.currencyId} / tick
                </span>
              </>
            ) : (
              <>
                <MinusCircle size={12} color="#f87171" />
                <span style={{ color: '#f87171' }}>
                  -{node.rule.amount} {currencyMap.get(node.rule.currencyId)?.symbol || node.rule.currencyId} / tick
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Blender-style Output Socket (Right Side - Source Sender) */}
      <div
        className="blender-socket blender-socket-output"
        title="Output Socket: Drag wire to connect to another node"
        onMouseDown={(e) => {
          e.stopPropagation()
          onStartConnect(e, node.id)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onStartConnect(e, node.id)
        }}
        style={{
          position: 'absolute',
          right: '-9px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: isConnectingSource ? '#38bdf8' : '#0f172a',
          border: isConnectingSource ? '2px solid #ffffff' : '2px solid #38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
          zIndex: 30,
          boxShadow: isConnectingSource
            ? '0 0 10px #38bdf8, inset 0 0 4px #38bdf8'
            : '0 2px 4px rgba(0,0,0,0.6)',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isConnectingSource ? '#ffffff' : '#38bdf8',
          }}
        />
      </div>
    </div>
  )
}
