import React from 'react'
import { X, ArrowRight, Trash2, ScrollText } from 'lucide-react'
import { TransactionExecutionEvent, Currency, SimulationNode } from '../types/simulation'

interface TransactionLogProps {
  isOpen: boolean
  onClose: () => void
  events: TransactionExecutionEvent[]
  currencies: Currency[]
  nodes: SimulationNode[]
  onClearEvents: () => void
}

export const TransactionLog: React.FC<TransactionLogProps> = ({
  isOpen,
  onClose,
  events,
  currencies,
  nodes,
  onClearEvents,
}) => {
  if (!isOpen) return null

  const nodeMap = new Map<string, SimulationNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  const currencyMap = new Map<string, Currency>()
  currencies.forEach((c) => currencyMap.set(c.id, c))

  // Reverse order (newest first)
  const reversedEvents = [...events].reverse()

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '240px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        zIndex: 45,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScrollText size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Transaction Execution Ledger ({events.length} events)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              title="Clear event history"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {reversedEvents.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            No transactions executed yet. Press Play or Step to trigger simulation ticks.
          </div>
        ) : (
          reversedEvents.map((ev) => {
            const srcNode = nodeMap.get(ev.sourceNodeId)
            const tgtNode = nodeMap.get(ev.targetNodeId)
            const srcCur = currencyMap.get(ev.sourceCurrencyId)
            const tgtCur = currencyMap.get(ev.targetCurrencyId)
            const isFx = ev.sourceCurrencyId !== ev.targetCurrencyId

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#38bdf8',
                      backgroundColor: '#38bdf811',
                      padding: '2px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    Tick #{ev.tick}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {srcNode?.label || ev.sourceNodeId}
                    </span>
                    <ArrowRight size={12} color="#64748b" />
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {tgtNode?.label || ev.targetNodeId}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    <span style={{ color: srcCur?.color || '#94a3b8' }}>
                      -{ev.sourceAmount.toFixed(srcCur?.decimals ?? 2)} {srcCur?.symbol || ev.sourceCurrencyId}
                    </span>
                    <span style={{ color: '#64748b', margin: '0 4px' }}>→</span>
                    <span style={{ color: tgtCur?.color || '#94a3b8' }}>
                      +{ev.targetAmount.toFixed(tgtCur?.decimals ?? 2)} {tgtCur?.symbol || ev.targetCurrencyId}
                    </span>
                  </div>

                  {isFx && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#38bdf822',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                      }}
                    >
                      rate: ×{ev.exchangeRate}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
