import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  SimulationState,
  SimulationNode,
  SimulationTransaction,
  Currency,
  TransactionExecutionEvent,
  NodeRole,
} from './types/simulation'
import { executeTick } from './engine/simulationEngine'
import {
  dualCurrencyFxBridge,
  circularEconomyWithBankAndSink,
  threeZoneTradeNetwork,
} from './presets/initialPresets'
import { ControlBar } from './components/ControlBar'
import { GraphCanvas } from './components/GraphCanvas'
import { NodeInspector } from './components/NodeInspector'
import { EdgeInspector } from './components/EdgeInspector'
import { CurrencyModal } from './components/CurrencyModal'
import { MetricsDashboard } from './components/MetricsDashboard'
import { TransactionLog } from './components/TransactionLog'

export function App() {
  // Initialize with Preset 1 (Dual Currency FX Bridge)
  const [state, setState] = useState<SimulationState>(() => dualCurrencyFxBridge())
  const [activePresetKey, setActivePresetKey] = useState<string>('dual-currency')

  // Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  // Drawer & Modal States
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false)
  const [isMetricsOpen, setIsMetricsOpen] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)

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

  // Global Keyboard shortcuts
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
    setRecentEvents([])
    setEventHistory([])

    if (presetKey === 'dual-currency') {
      setState(dualCurrencyFxBridge())
    } else if (presetKey === 'circular-economy') {
      setState(circularEconomyWithBankAndSink())
    } else if (presetKey === 'three-zone') {
      setState(threeZoneTradeNetwork())
    } else {
      // Blank canvas with standard reference currency
      setState({
        currencies: [
          { id: 'CRD', name: 'Credit', symbol: '₡', color: '#38bdf8', decimals: 2, baseExchangeRate: 1.0 },
        ],
        nodes: [
          {
            id: 'node-1',
            label: 'Prime Agent',
            role: 'agent',
            position: { x: 300, y: 250 },
            balances: { CRD: 1000 },
          },
        ],
        transactions: [],
        tick: 0,
        isPlaying: false,
        speedMs: 600,
        history: [],
      })
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

  // Add new node
  const handleAddNode = (role: NodeRole, label: string) => {
    const newId = `node_${Date.now().toString(36)}`
    const defaultBalances: Record<string, number> = {}
    state.currencies.forEach((c) => {
      defaultBalances[c.id] = 100
    })

    const newNode: SimulationNode = {
      id: newId,
      label: `${label} ${state.nodes.length + 1}`,
      role,
      position: { x: 350 + Math.random() * 80 - 40, y: 250 + Math.random() * 80 - 40 },
      balances: defaultBalances,
    }

    setState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))
    setSelectedNodeId(newId)
    setSelectedTransactionId(null)
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

  // Create new transaction (directed edge)
  const handleCreateTransaction = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return

    // Avoid duplicate parallel transaction with exact same endpoints
    const existing = state.transactions.find(
      (tx) => tx.source === sourceId && tx.target === targetId
    )
    if (existing) {
      setSelectedTransactionId(existing.id)
      return
    }

    const defaultCurrency = state.currencies[0]?.id || 'CRD'
    const newTx: SimulationTransaction = {
      id: `tx_${Date.now().toString(36)}`,
      source: sourceId,
      target: targetId,
      sourceCurrencyId: defaultCurrency,
      targetCurrencyId: defaultCurrency,
      exchangeRate: 1.0,
      amountRule: { type: 'fixed', value: 25 },
      condition: { type: 'always' },
      active: true,
      label: 'Transfer',
    }

    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
    }))
    setSelectedTransactionId(newTx.id)
    setSelectedNodeId(null)
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
    setState((prev) => ({
      ...prev,
      currencies: prev.currencies.filter((c) => c.id !== currencyId),
    }))
  }

  // Export Simulation JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `money-simulation-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import Simulation JSON
  const handleImportJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as SimulationState
        if (parsed.currencies && parsed.nodes && parsed.transactions) {
          setState({
            ...parsed,
            isPlaying: false,
          })
          setSelectedNodeId(null)
          setSelectedTransactionId(null)
          setRecentEvents([])
          setEventHistory([])
        } else {
          alert('Invalid simulation file structure.')
        }
      } catch (err) {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }

  const selectedNode = state.nodes.find((n) => n.id === selectedNodeId) || null
  const selectedTransaction =
    state.transactions.find((tx) => tx.id === selectedTransactionId) || null

  return (
    <div
      className="app-container"
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
          <GraphCanvas
            nodes={state.nodes}
            transactions={state.transactions}
            currencies={state.currencies}
            recentEvents={recentEvents}
            selectedNodeId={selectedNodeId}
            selectedTransactionId={selectedTransactionId}
            onSelectNode={setSelectedNodeId}
            onSelectTransaction={setSelectedTransactionId}
            onUpdateNodePosition={handleUpdateNodePosition}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
            onCreateTransaction={handleCreateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
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
      />
    </div>
  )
}

export default App
