import React, { useState } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Coins,
  BarChart3,
  ScrollText,
  Download,
  Upload,
  Layers,
  Keyboard,
  FilePlus,
  HelpCircle,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { Currency } from '../types/simulation'

interface ControlBarProps {
  tick: number
  isPlaying: boolean
  speedMs: number
  currencies: Currency[]
  activePresetName: string
  isMetricsOpen: boolean
  isLogOpen: boolean
  viewCurrencyId?: string
  onSelectViewCurrency?: (currencyId: string) => void
  onTogglePlay: () => void
  onStepTick: () => void
  onReset: () => void
  onChangeSpeed: (speedMs: number) => void
  onSelectPreset: (presetKey: string) => void
  onOpenCurrenciesModal: () => void
  onToggleMetrics: () => void
  onToggleLog: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
}

const PRESETS = [
  { key: 'blank', label: 'Blank Canvas (Build from Scratch)' },
  { key: 'dual-currency', label: 'Dual Currency FX Bridge' },
  { key: 'circular-economy', label: 'Circular Economy with Bank & Sink' },
  { key: 'three-zone', label: 'Three-Zone Trade Network' },
  { key: 'easy-connect-example', label: 'Easy Connect (ReactFlow)' },
]

const SPEEDS = [
  { label: '0.5x', ms: 1200 },
  { label: '1x', ms: 600 },
  { label: '2x', ms: 300 },
  { label: '5x', ms: 120 },
]

export const ControlBar: React.FC<ControlBarProps> = ({
  tick,
  isPlaying,
  speedMs,
  currencies,
  activePresetName,
  isMetricsOpen,
  isLogOpen,
  viewCurrencyId = 'native',
  onSelectViewCurrency,
  onTogglePlay,
  onStepTick,
  onReset,
  onChangeSpeed,
  onSelectPreset,
  onOpenCurrenciesModal,
  onToggleMetrics,
  onToggleLog,
  onExportJson,
  onImportJson,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImportJson(file)
      e.target.value = ''
    }
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #334155',
        color: '#f8fafc',
        zIndex: 40,
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Brand & Preset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#38bdf822',
              border: '1px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Coins size={16} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
              MONEY FLOW SIMULATOR
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              Multi-Currency Graph Engine
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="#64748b" />
          <select
            value={activePresetName}
            onChange={(e) => onSelectPreset(e.target.value)}
            style={{
              padding: '5px 8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          {/* New / Clear Graph Button */}
          <button
            onClick={() => onSelectPreset('blank')}
            title="Start New Blank Graph"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              backgroundColor: activePresetName === 'blank' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              border: activePresetName === 'blank' ? '1px solid #38bdf8' : '1px solid #334155',
              borderRadius: '6px',
              color: activePresetName === 'blank' ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <FilePlus size={13} />
            <span>New Graph</span>
          </button>
        </div>
      </div>

      {/* Simulation Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: isPlaying ? '#f59e0b' : '#10b981',
            color: '#0f172a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Step Tick Button */}
        <button
          onClick={onStepTick}
          disabled={isPlaying}
          title="Advance 1 Tick"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: '#1e293b',
            color: isPlaying ? '#475569' : '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
          }}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset Simulation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        {/* Speed Selector */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          {SPEEDS.map((s) => {
            const isCurrent = speedMs === s.ms
            return (
              <button
                key={s.label}
                onClick={() => onChangeSpeed(s.ms)}
                style={{
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: isCurrent ? '#38bdf8' : 'transparent',
                  color: isCurrent ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Tick Counter Badge */}
        <div
          style={{
            padding: '4px 10px',
            backgroundColor: '#1e293b',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: '#38bdf8',
          }}
        >
          Tick #{tick}
        </div>
      </div>

      {/* Utility Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Global View Currency Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 4px', fontSize: '10px', color: '#94a3b8' }}>
            <Eye size={12} color="#38bdf8" />
            <span>View:</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectViewCurrency?.('native')
              setIsViewDropdownOpen(false)
            }}
            title="View money in each node's assigned currency wrapper"
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '4px',
              backgroundColor: viewCurrencyId === 'native' ? '#38bdf8' : 'transparent',
              color: viewCurrencyId === 'native' ? '#0f172a' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Native
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectViewCurrency?.('USD')
              setIsViewDropdownOpen(false)
            }}
            title="View all money unified in US Dollar ($ USD)"
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '4px',
              backgroundColor: viewCurrencyId === 'USD' ? '#10b981' : 'transparent',
              color: viewCurrencyId === 'USD' ? '#064e3b' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            $ USD
          </button>
          {currencies.filter((c) => c.id !== 'USD').length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsViewDropdownOpen((prev) => !prev)}
                title="Select another currency wrapper to view all money"
                style={{
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: viewCurrencyId !== 'native' && viewCurrencyId !== 'USD' ? '#a78bfa' : 'transparent',
                  color: viewCurrencyId !== 'native' && viewCurrencyId !== 'USD' ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>
                  {viewCurrencyId !== 'native' && viewCurrencyId !== 'USD' ? viewCurrencyId : 'More...'}
                </span>
                <ChevronDown size={10} />
              </button>

              {isViewDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                    zIndex: 60,
                    minWidth: '130px',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {currencies.filter((c) => c.id !== 'USD').map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectViewCurrency?.(c.id)
                        setIsViewDropdownOpen(false)
                      }}
                      style={{
                        padding: '5px 8px',
                        fontSize: '11px',
                        textAlign: 'left',
                        backgroundColor: viewCurrencyId === c.id ? `${c.color}22` : 'transparent',
                        color: viewCurrencyId === c.id ? c.color : '#f8fafc',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{c.name}</span>
                      <span style={{ fontFamily: 'monospace', color: c.color, fontWeight: 700 }}>
                        {c.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Currencies Button */}
        <button
          onClick={onOpenCurrenciesModal}
          title="Open Currency Registry & Transitive FX Triangulation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: '#1e293b',
            border: '1px solid #10b98155',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <Coins size={14} color="#10b981" />
          <span>Currencies ($ Base)</span>
          <span
            style={{
              padding: '1px 5px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            {currencies.length}
          </span>
        </button>

        {/* Metrics Toggle */}
        <button
          onClick={onToggleMetrics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: isMetricsOpen ? '#38bdf822' : '#1e293b',
            border: isMetricsOpen ? '1px solid #38bdf8' : '1px solid #334155',
            color: isMetricsOpen ? '#38bdf8' : '#f8fafc',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <BarChart3 size={14} />
          <span>Metrics</span>
        </button>

        {/* Event Log Toggle */}
        <button
          onClick={onToggleLog}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: isLogOpen ? '#38bdf822' : '#1e293b',
            border: isLogOpen ? '1px solid #38bdf8' : '1px solid #334155',
            color: isLogOpen ? '#38bdf8' : '#f8fafc',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <ScrollText size={14} />
          <span>Log</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={onExportJson}
          title="Export Simulation JSON"
          style={{
            padding: '6px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <Download size={14} />
        </button>

        {/* Import JSON */}
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Simulation JSON"
          style={{
            padding: '6px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <Upload size={14} />
        </button>

        {/* Blender Graph Controls Guide */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            title="Blender Node Graph Shortcuts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              backgroundColor: showShortcuts ? '#38bdf822' : '#1e293b',
              border: showShortcuts ? '1px solid #38bdf8' : '1px solid #334155',
              borderRadius: '6px',
              color: showShortcuts ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            <Keyboard size={14} />
            <span>Shortcuts</span>
          </button>

          {showShortcuts && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '36px',
                width: '300px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.7)',
                zIndex: 60,
                color: '#f8fafc',
                fontSize: '11px',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#38bdf8',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Blender Node Controls</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>UX Guide</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Add Node Menu</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Shift + A
                  </kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Connect Nodes</span>
                  <span style={{ color: '#38bdf8' }}>Drag Output to Input</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Knife Cut Routes</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Ctrl + RMB Drag
                  </kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Delete Selected</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    X or Delete
                  </kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Duplicate Node</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Shift + D
                  </kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Play / Pause</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Space
                  </kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Step 1 Tick</span>
                  <kbd style={{ backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    S
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
