import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  SimulationState,
  SimulationNode,
  SimulationTransaction,
  Currency,
  TransactionExecutionEvent,
  NodeRole,
  TransactionAmountRule,
  TransactionCondition,
} from './types/simulation'
import { executeTick } from './engine/simulationEngine'
import {
  dualCurrencyFxBridge,
  circularEconomyWithBankAndSink,
  threeZoneTradeNetwork,
  blankCanvas,
} from './presets/initialPresets'
import { ControlBar } from './components/ControlBar'
import { GraphCanvas } from './components/GraphCanvas'
import { NodeInspector } from './components/NodeInspector'
import { EdgeInspector } from './components/EdgeInspector'
import { CurrencyModal } from './components/CurrencyModal'
import { CreateNodeModal } from './components/CreateNodeModal'
import { CreateEdgeModal } from './components/CreateEdgeModal'
import { MetricsDashboard } from './components/MetricsDashboard'
import { TransactionLog } from './components/TransactionLog'
import { EasyConnectExample } from './EasyConnectExample'

export function App() {
  // Initialize with Preset 1 (Dual Currency FX Bridge)
  const [state, setState] = useState<SimulationState>(() => dualCurrencyFxBridge())
  const [activePresetKey, setActivePresetKey] = useState<string>('dual-currency')
  const [viewCurrencyId, setViewCurrencyId] = useState<string>('native')

  // Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  // Drawer & Modal States
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false)
  const [isMetricsOpen, setIsMetricsOpen] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)

  // Intercepting Creation Modals State
  const [pendingNodeCreation, setPendingNodeCreation] = useState<{
    role: NodeRole
    position: { x: number; y: number }
  } | null>(null)

  const [pendingEdgeCreation, setPendingEdgeCreation] = useState<{
    sourceId: string
    targetId: string
  } | null>(null)

  // Recent events for particle animations
  const [recentEvents, setRecentEvents] = useState<TransactionExecutionEvent[]>([])
  // All executed events history
  const [eventHistory, setEventHistory] = useState<TransactionExecutionEvent[]>([])

  // Step tick function
  const stepTick = useCallback(() => {
    setState((prevState) => {
      const { nextState, events } = executeTick(prevState)
      if (events.length > 0) {
        setRecentEvents(events)
        setEventHistory((prev) => [...prev.slice(-200), ...events])
      }
      return nextState
    })
  }, [])

  // Simulation playback interval loop
  useEffect(() => {
    if (!state.isPlaying) return

    const interval = setInterval(() => {
      stepTick()
    }, state.speedMs)

    return () => clearInterval(interval)
  }, [state.isPlaying, state.speedMs, stepTick])

  // Global Keyboard shortcuts (Space = Play/Pause, S = Step, M = Metrics, L = Log)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (!state.isPlaying) {
          stepTick()
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMetricsOpen((prev) => !prev)
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLogOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isPlaying, stepTick])

  // Preset switching
  const handleSelectPreset = (presetKey: string) => {
    setActivePresetKey(presetKey)
    setSelectedNodeId(null)
    setSelectedTransactionId(null)
    setViewCurrencyId('native')
    setRecentEvents([])
    setEventHistory([])

    if (presetKey === 'dual-currency') {
      setState(dualCurrencyFxBridge())
    } else if (presetKey === 'circular-economy') {
      setState(circularEconomyWithBankAndSink())
    } else if (presetKey === 'three-zone') {
      setState(threeZoneTradeNetwork())
    } else if (presetKey === 'easy-connect-example') {
      setState(blankCanvas())
    } else {
      // Blank canvas: completely empty graph for user-driven creation
      setState(blankCanvas())
    }
  }

  // Reset simulation
  const handleReset = () => {
    handleSelectPreset(activePresetKey)
  }

  // Node position update
  const handleUpdateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    }))
  }

  // Request Node Creation: Intercept with CreateNodeModal
  const handleRequestCreateNode = (role: NodeRole, position: { x: number; y: number }) => {
    setPendingNodeCreation({ role, position })
  }

  // Confirm Node Creation from Modal
  const handleConfirmCreateNode = (nodeData: Omit<SimulationNode, 'id'>) => {
    const newId = `node_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
    const newNode: SimulationNode = {
      id: newId,
      ...nodeData,
    }

    setState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))
    setSelectedNodeId(newId)
    setSelectedTransactionId(null)
    setPendingNodeCreation(null)
  }

  // Duplicate node (Shift + D)
  const handleDuplicateNode = (nodeId: string) => {
    const nodeToDup = state.nodes.find((n) => n.id === nodeId)
    if (!nodeToDup) return
    setPendingNodeCreation({
      role: nodeToDup.role,
      position: { x: nodeToDup.position.x + 40, y: nodeToDup.position.y + 40 },
    })
  }

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      transactions: prev.transactions.filter(
        (tx) => tx.source !== nodeId && tx.target !== nodeId
      ),
    }))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  // Update node properties
  const handleUpdateNode = (updatedNode: SimulationNode) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
    }))
  }

  // Request Transaction Creation: Intercept with CreateEdgeModal
  const handleRequestCreateTransaction = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return

    // Avoid duplicate parallel transaction with exact same endpoints
    const existing = state.transactions.find(
      (tx) => tx.source === sourceId && tx.target === targetId
    )
    if (existing) {
      setSelectedTransactionId(existing.id)
      return
    }

    setPendingEdgeCreation({ sourceId, targetId })
  }

  // Confirm Transaction Creation from Modal
  const handleConfirmCreateTransaction = (txData: {
    sourceCurrencyId: string
    targetCurrencyId: string
    exchangeRate: number
    amountRule: TransactionAmountRule
    condition: TransactionCondition
    active: boolean
    label?: string
  }) => {
    if (!pendingEdgeCreation) return

    const newId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
    const newTx: SimulationTransaction = {
      id: newId,
      source: pendingEdgeCreation.sourceId,
      target: pendingEdgeCreation.targetId,
      ...txData,
    }

    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
    }))
    setSelectedTransactionId(newTx.id)
    setSelectedNodeId(null)
    setPendingEdgeCreation(null)
  }

  // Update transaction properties
  const handleUpdateTransaction = (updatedTx: SimulationTransaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === updatedTx.id ? updatedTx : tx
      ),
    }))
  }

  // Delete transaction
  const handleDeleteTransaction = (txId: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== txId),
    }))
    if (selectedTransactionId === txId) {
      setSelectedTransactionId(null)
    }
  }

  // Add currency
  const handleAddCurrency = (currency: Currency) => {
    setState((prev) => ({
      ...prev,
      currencies: [...prev.currencies, currency],
    }))
  }

  // Update currency
  const handleUpdateCurrency = (updatedCurrency: Currency) => {
    setState((prev) => ({
      ...prev,
      currencies: prev.currencies.map((c) =>
        c.id === updatedCurrency.id ? updatedCurrency : c
      ),
    }))
  }

  // Delete currency
  const handleDeleteCurrency = (currencyId: string) => {
    setState((prev) => {
      const updatedCurrencies = prev.currencies.filter((c) => c.id !== currencyId)
      const updatedNodes = prev.nodes.map((node) => {
        const newBalances = { ...node.balances }
        delete newBalances[currencyId]
        let newRule = node.rule
        if (node.rule && node.rule.currencyId === currencyId) {
          newRule = undefined
        }
        return {
          ...node,
          balances: newBalances,
          rule: newRule,
        }
      })
      const updatedTransactions = prev.transactions.filter(
        (tx) => tx.sourceCurrencyId !== currencyId && tx.targetCurrencyId !== currencyId
      )
      return {
        ...prev,
        currencies: updatedCurrencies,
        nodes: updatedNodes,
        transactions: updatedTransactions,
      }
    })
  }

  // Set default / base currency anchor
  const handleSetDefaultCurrency = (currencyId: string) => {
    setState((prev) => ({
      ...prev,
      defaultCurrencyId: currencyId,
      currencies: prev.currencies.map((c) => ({
        ...c,
        isDefault: c.id === currencyId,
      })),
    }))
  }

  // Export state to JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `economy_simulation_tick_${state.tick}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import state from JSON file
  const handleImportJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        if (json && Array.isArray(json.nodes) && Array.isArray(json.transactions)) {
          setState(json)
          setSelectedNodeId(null)
          setSelectedTransactionId(null)
          setRecentEvents([])
          setEventHistory([])
        } else {
          alert('Invalid simulation file format.')
        }
      } catch (err) {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }

  const selectedNode = state.nodes.find((n) => n.id === selectedNodeId)
  const selectedTransaction = state.transactions.find((tx) => tx.id === selectedTransactionId)

  const pendingSourceNode = pendingEdgeCreation
    ? state.nodes.find((n) => n.id === pendingEdgeCreation.sourceId) || null
    : null
  const pendingTargetNode = pendingEdgeCreation
    ? state.nodes.find((n) => n.id === pendingEdgeCreation.targetId) || null
    : null

  return (
    <div
      className="economy-app-root"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#090d16',
        overflow: 'hidden',
        position: 'relative',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Top Simulation Control Bar */}
      <ControlBar
        tick={state.tick}
        isPlaying={state.isPlaying}
        speedMs={state.speedMs}
        currencies={state.currencies}
        activePresetName={activePresetKey}
        isMetricsOpen={isMetricsOpen}
        isLogOpen={isLogOpen}
        viewCurrencyId={viewCurrencyId}
        onSelectViewCurrency={setViewCurrencyId}
        onTogglePlay={() => setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}
        onStepTick={stepTick}
        onReset={handleReset}
        onChangeSpeed={(speedMs) => setState((prev) => ({ ...prev, speedMs }))}
        onSelectPreset={handleSelectPreset}
        onOpenCurrenciesModal={() => setIsCurrencyModalOpen(true)}
        onToggleMetrics={() => setIsMetricsOpen((prev) => !prev)}
        onToggleLog={() => setIsLogOpen((prev) => !prev)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Main Workspace (Graph Canvas + Inspector Sidebar) */}
      <div
        className="main-workspace"
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Interactive Graph Canvas */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {activePresetKey === 'easy-connect-example' ? (
            <EasyConnectExample />
          ) : (
            <GraphCanvas
              nodes={state.nodes}
              transactions={state.transactions}
              currencies={state.currencies}
              recentEvents={recentEvents}
              selectedNodeId={selectedNodeId}
              selectedTransactionId={selectedTransactionId}
              viewCurrencyId={viewCurrencyId}
              onSelectNode={setSelectedNodeId}
              onSelectTransaction={setSelectedTransactionId}
              onUpdateNodePosition={handleUpdateNodePosition}
              onRequestCreateNode={handleRequestCreateNode}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              onRequestCreateTransaction={handleRequestCreateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </div>

        {/* Right Sidebar: Node or Edge Inspector */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            currencies={state.currencies}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
          />
        )}

        {selectedTransaction && !selectedNode && (
          <EdgeInspector
            transaction={selectedTransaction}
            nodes={state.nodes}
            currencies={state.currencies}
            onClose={() => setSelectedTransactionId(null)}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Bottom Drawer: Metrics Dashboard */}
        <MetricsDashboard
          isOpen={isMetricsOpen}
          onClose={() => setIsMetricsOpen(false)}
          nodes={state.nodes}
          currencies={state.currencies}
          history={state.history}
        />

        {/* Bottom Drawer: Transaction Execution Log */}
        <TransactionLog
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
          events={eventHistory}
          currencies={state.currencies}
          nodes={state.nodes}
          onClearEvents={() => setEventHistory([])}
        />
      </div>

      {/* Currency Registry Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        currencies={state.currencies}
        onAddCurrency={handleAddCurrency}
        onUpdateCurrency={handleUpdateCurrency}
        onDeleteCurrency={handleDeleteCurrency}
        defaultCurrencyId={state.defaultCurrencyId || 'USD'}
        onSetDefaultCurrency={handleSetDefaultCurrency}
      />

      {/* Intercepted Node Creation Modal */}
      {pendingNodeCreation && (
        <CreateNodeModal
          isOpen={true}
          canvasPosition={pendingNodeCreation.position}
          currencies={state.currencies}
          existingNodeCount={state.nodes.length}
          onConfirm={handleConfirmCreateNode}
          onCancel={() => setPendingNodeCreation(null)}
        />
      )}

      {/* Intercepted Edge / Connection Creation Modal */}
      {pendingEdgeCreation && pendingSourceNode && pendingTargetNode && (
        <CreateEdgeModal
          isOpen={true}
          sourceNode={pendingSourceNode}
          targetNode={pendingTargetNode}
          currencies={state.currencies}
          onConfirm={handleConfirmCreateTransaction}
          onCancel={() => setPendingEdgeCreation(null)}
        />
      )}
    </div>
  )
}

export default App
