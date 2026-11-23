import React, { useState } from 'react'
import {
  CircleDot,
  Coins,
  Flame,
  PlusCircle,
  MinusCircle,
  GripHorizontal,
  DollarSign,
  ArrowRightLeft,
} from 'lucide-react'
import { SimulationNode, Currency } from '../types/simulation'
import {
  getNodeCurrencyId,
  getNodeBalance,
  getNodeUsdValue,
  DEFAULT_BASE_CURRENCY,
  getUnitsPerDollar,
} from '../utils/currency'

interface NodeViewProps {
  node: SimulationNode
  currencies: Currency[]
  selected?: boolean
  isConnectingSource?: boolean
  isPotentialTarget?: boolean
  isHoveredTarget?: boolean
  viewCurrencyId?: string
  onSelect: () => void
  onStartConnect: (e: React.MouseEvent, nodeId: string) => void
  onCompleteConnect?: (nodeId: string) => void
  onDragStart: (e: React.MouseEvent, nodeId: string) => void
}

export const NodeView: React.FC<NodeViewProps> = ({
  node,
  currencies,
  selected = false,
  isConnectingSource = false,
  isPotentialTarget = false,
  isHoveredTarget = false,
  viewCurrencyId = 'native',
  onSelect,
  onStartConnect,
  onCompleteConnect,
  onDragStart,
}) => {

  // Local state to toggle between native currency wrapper and USD display on click
  const [showUsdPrimary, setShowUsdPrimary] = useState(false)

  // Primary currency wrapper for this node
  const nativeCurId = getNodeCurrencyId(node, currencies)
  const nativeCurrency =
    currencies.find((c) => c.id === nativeCurId) ||
    currencies[0] ||
    DEFAULT_BASE_CURRENCY

  // Compute total money values
  const totalUsdValue = getNodeUsdValue(node, currencies)
  const nativeBalance = getNodeBalance(node, nativeCurId, currencies)

  // Active view currency (if global view mode is set)
  const effectiveViewCurId =
    viewCurrencyId !== 'native' && viewCurrencyId ? viewCurrencyId : (showUsdPrimary ? 'USD' : nativeCurId)
  const displayCurrency =
    currencies.find((c) => c.id === effectiveViewCurId) || nativeCurrency
  const displayBalance = getNodeBalance(node, effectiveViewCurId, currencies)

  const isNative = effectiveViewCurId === nativeCurId
  const nativeDecimals = nativeCurrency.decimals ?? 2
  const displayDecimals = displayCurrency.decimals ?? 2

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
          <CircleDot size={15} color="#38bdf8" />
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
          {/* Easy Connect Trigger */}
          <button
            type="button"
            className="easy-connect-btn"
            title="Easy Connect: Drag to connect to another node"
            onMouseDown={(e) => {
              e.stopPropagation()
              onStartConnect(e, node.id)
            }}
            onClick={(e) => {
              e.stopPropagation()
              onStartConnect(e, node.id)
            }}
            style={{
              padding: '2px 5px',
              backgroundColor: isConnectingSource ? '#f59e0b' : 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf844',
              borderRadius: '4px',
              color: isConnectingSource ? '#ffffff' : '#38bdf8',
              fontSize: '9px',
              fontWeight: 600,
              cursor: 'crosshair',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            Connect ➔
          </button>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 600,
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            NODE
          </span>
          <GripHorizontal size={14} color="#64748b" />
        </div>
      </div>

      {/* Easy Connect Target Feedback Banner */}
      {isPotentialTarget && (
        <div
          style={{
            backgroundColor: isHoveredTarget ? '#10b98133' : '#10b98118',
            borderBottom: isHoveredTarget ? '1px solid #34d399' : '1px dashed #34d39966',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#34d399',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span>▼ Drop here to connect</span>
        </div>
      )}
      {isConnectingSource && (
        <div
          style={{
            backgroundColor: '#f59e0b22',
            borderBottom: '1px solid #f59e0b',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#f59e0b',
            textAlign: 'center',
          }}
        >
          Connecting from here ➔
        </div>
      )}

      {/* Unified Money & Value Section */}
      <div style={{ padding: '10px 10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            Money Holding
          </span>

          {/* Currency Wrapper Badge */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              setShowUsdPrimary((prev) => !prev)
            }}
            title={`Currency Wrapper: ${nativeCurrency.name} (Factor x = ${getUnitsPerDollar(nativeCurrency)}). Click to toggle USD/Wrapper view.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: `${nativeCurrency.color}22`,
              border: `1px solid ${nativeCurrency.color}66`,
              padding: '2px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: nativeCurrency.color,
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: nativeCurrency.color,
                fontFamily: 'monospace',
              }}
            >
              {nativeCurrency.symbol} {nativeCurrency.id}
            </span>
          </div>
        </div>

        {/* Primary Money Value Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#070c18',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #1e293b',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 700,
                color: displayCurrency.color || '#f8fafc',
              }}
            >
              {displayBalance.toLocaleString(undefined, {
                minimumFractionDigits: displayDecimals,
                maximumFractionDigits: displayDecimals,
              })}{' '}
              {displayCurrency.symbol}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
              {displayCurrency.id}
            </span>
          </div>

          {/* Dollar Value & Wrapper Relation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: '1px solid #1e293b',
              fontSize: '10px',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Dollar Value:</span>
            <span
              style={{
                color: '#10b981',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
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
                  +{node.rule.amount} {nativeCurrency.symbol} / tick
                </span>
              </>
            ) : (
              <>
                <MinusCircle size={12} color="#f87171" />
                <span style={{ color: '#f87171' }}>
                  -{node.rule.amount} {nativeCurrency.symbol} / tick
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
export default NodeView
