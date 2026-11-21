import React from 'react'
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
  { key: 'dual-currency', label: 'Dual Currency FX Bridge' },
  { key: 'circular-economy', label: 'Circular Economy with Bank & Sink' },
  { key: 'three-zone', label: 'Three-Zone Trade Network' },
  { key: 'blank', label: 'Blank Canvas' },
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
        {/* Currencies Button */}
        <button
          onClick={onOpenCurrenciesModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <Coins size={14} color="#eab308" />
          <span>Currencies</span>
          <span
            style={{
              padding: '1px 5px',
              backgroundColor: '#eab30822',
              color: '#eab308',
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
      </div>
    </header>
  )
}
