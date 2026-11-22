import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  CircleDot,
  CornerDownLeft,
  X,
} from 'lucide-react'
import { NodeRole } from '../types/simulation'

interface AddNodeMenuProps {
  isOpen: boolean
  screenPosition: { x: number; y: number }
  onSelectRole: (role: NodeRole) => void
  onClose: () => void
}

interface RoleOption {
  role: NodeRole
  name: string
  subtitle: string
  icon: typeof CircleDot
  color: string
  numberKey: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'node',
    name: 'Node',
    subtitle: 'Holds money & routes transfers',
    icon: CircleDot,
    color: '#38bdf8',
    numberKey: '1',
    description: 'Universal node entity capable of holding money balances and acting as an economic junction.',
  },
]

export const AddNodeMenu: React.FC<AddNodeMenuProps> = ({
  isOpen,
  screenPosition,
  onSelectRole,
  onClose,
}) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filtered options based on search query
  const filteredOptions = ROLE_OPTIONS.filter(
    (opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase()) ||
      opt.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      opt.role.toLowerCase().includes(search.toLowerCase())
  )

  // Auto-focus input on open and reset state
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredOptions.length) {
      setSelectedIndex(Math.max(0, filteredOptions.length - 1))
    }
  }, [filteredOptions.length, selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredOptions.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredOptions[selectedIndex]) {
          onSelectRole(filteredOptions[selectedIndex].role)
        }
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key) && !search) {
        const option = ROLE_OPTIONS.find((o) => o.numberKey === e.key)
        if (option) {
          e.preventDefault()
          onSelectRole(option.role)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredOptions, selectedIndex, search, onSelectRole, onClose])

  if (!isOpen) return null

  // Clamp popup position to viewport
  const menuWidth = 280
  const menuHeight = 400
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const clampedX = Math.min(Math.max(10, screenPosition.x), viewportWidth - menuWidth - 20)
  const clampedY = Math.min(Math.max(10, screenPosition.y), viewportHeight - menuHeight - 20)

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 998,
          cursor: 'default',
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
      />

      {/* Floating Blender-style Search Menu */}
      <div
        ref={containerRef}
        className="add-node-menu"
        style={{
          position: 'fixed',
          left: `${clampedX}px`,
          top: `${clampedY}px`,
          width: `${menuWidth}px`,
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '10px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          color: '#f8fafc',
          zIndex: 999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.1s ease-out',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Blender shortcut badge */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8' }}>
              Add Node
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Shift + A
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search input field */}
        <div
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#090d16',
          }}
        >
          <Search size={14} color="#64748b" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes... (1-6)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Node Options List */}
        <div
          style={{
            padding: '4px',
            maxHeight: '290px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            >
              No matching node types
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const Icon = opt.icon
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={opt.role}
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRole(opt.role)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    backgroundColor: isSelected ? '#1e293b' : 'transparent',
                    border: isSelected ? '1px solid #334155' : '1px solid transparent',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: `${opt.color}20`,
                      border: `1px solid ${opt.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color={opt.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                        {opt.name}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          color: '#64748b',
                          backgroundColor: '#090d16',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          border: '1px solid #1e293b',
                        }}
                      >
                        {opt.numberKey}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.subtitle}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: '#090d16',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#64748b',
          }}
        >
          <span>↑↓ to navigate</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CornerDownLeft size={10} /> select
          </span>
        </div>
      </div>
    </>
  )
}
