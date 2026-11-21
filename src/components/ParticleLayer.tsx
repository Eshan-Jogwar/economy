import React, { useEffect, useState } from 'react'
import { TransactionExecutionEvent, Currency } from '../types/simulation'

interface ParticleLayerProps {
  events: TransactionExecutionEvent[]
  currencies: Currency[]
  nodePositions: Record<string, { x: number; y: number }>
  nodeDimensions?: { width: number; height: number }
}

interface ActiveParticle {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourceColor: string
  targetColor: string
  sourceSymbol: string
  targetSymbol: string
  progress: number
  startTime: number
  duration: number
}

export const ParticleLayer: React.FC<ParticleLayerProps> = ({
  events,
  currencies,
  nodePositions,
  nodeDimensions = { width: 220, height: 130 },
}) => {
  const [particles, setParticles] = useState<ActiveParticle[]>([])

  const nodeWidth = nodeDimensions.width
  const nodeHeight = nodeDimensions.height

  useEffect(() => {
    if (!events || events.length === 0) return

    const now = performance.now()
    const newParticles: ActiveParticle[] = []

    events.forEach((ev, idx) => {
      const srcPos = nodePositions[ev.sourceNodeId]
      const tgtPos = nodePositions[ev.targetNodeId]
      if (!srcPos || !tgtPos) return

      const srcCur = currencies.find((c) => c.id === ev.sourceCurrencyId)
      const tgtCur = currencies.find((c) => c.id === ev.targetCurrencyId)

      const sourceX = srcPos.x + nodeWidth / 2
      const sourceY = srcPos.y + nodeHeight / 2
      const targetX = tgtPos.x + nodeWidth / 2
      const targetY = tgtPos.y + nodeHeight / 2

      newParticles.push({
        id: `particle-${ev.id}-${now}-${idx}`,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourceColor: srcCur?.color || '#38bdf8',
        targetColor: tgtCur?.color || '#38bdf8',
        sourceSymbol: srcCur?.symbol || '$',
        targetSymbol: tgtCur?.symbol || '$',
        progress: 0,
        startTime: now + idx * 30,
        duration: 750,
      })
    })

    if (newParticles.length > 0) {
      setParticles((prev) => [...prev.slice(-30), ...newParticles])
    }
  }, [events, nodePositions, currencies, nodeWidth, nodeHeight])

  useEffect(() => {
    if (particles.length === 0) return

    let animId: number
    const animate = (currentTime: number) => {
      setParticles((prevParticles) => {
        const remaining: ActiveParticle[] = []
        for (const p of prevParticles) {
          if (currentTime < p.startTime) {
            remaining.push(p)
            continue
          }
          const elapsed = currentTime - p.startTime
          const rawProgress = elapsed / p.duration
          if (rawProgress < 1) {
            const easeProgress =
              rawProgress < 0.5
                ? 2 * rawProgress * rawProgress
                : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2
            remaining.push({ ...p, progress: easeProgress })
          }
        }
        return remaining
      })

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [particles.length])

  return (
    <g className="particle-layer" pointerEvents="none">
      {particles.map((p) => {
        const midX = (p.sourceX + p.targetX) / 2
        const midY = (p.sourceY + p.targetY) / 2
        const dx = p.targetX - p.sourceX
        const dy = p.targetY - p.sourceY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const offset = Math.min(60, dist * 0.18)
        const ctrlX = midX - (dy / dist) * offset
        const ctrlY = midY + (dx / dist) * offset

        const t = p.progress
        const invT = 1 - t
        const curX = invT * invT * p.sourceX + 2 * invT * t * ctrlX + t * t * p.targetX
        const curY = invT * invT * p.sourceY + 2 * invT * t * ctrlY + t * t * p.targetY

        const currentColor = t < 0.5 ? p.sourceColor : p.targetColor
        const currentSymbol = t < 0.5 ? p.sourceSymbol : p.targetSymbol

        return (
          <g key={p.id} transform={`translate(${curX}, ${curY})`}>
            <circle r={10} fill={currentColor} opacity={0.25} />
            <circle r={5} fill={currentColor} opacity={0.9} />
            <text
              y={-8}
              textAnchor="middle"
              fill={currentColor}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {currentSymbol}
            </text>
          </g>
        )
      })}
    </g>
  )
}
