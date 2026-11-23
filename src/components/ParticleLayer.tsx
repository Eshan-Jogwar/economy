import React, { useEffect, useState } from 'react'
import { TransactionExecutionEvent, Currency } from '../types/simulation'
import { getEdgeParams } from '../utils'

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
  nodeDimensions = { width: 200, height: 80 },
}) => {
  const [particles, setParticles] = useState<ActiveParticle[]>([])

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

      // Dynamic floating border-to-border straight path
      const edgeParams = getEdgeParams(
        { position: srcPos, measured: nodeDimensions },
        { position: tgtPos, measured: nodeDimensions }
      )

      let { sx: sourceX, sy: sourceY, tx: targetX, ty: targetY } = edgeParams

      // Bidirectional parallel offset
      const isBidi = events.some(
        (o) =>
          o.id !== ev.id &&
          o.sourceNodeId === ev.targetNodeId &&
          o.targetNodeId === ev.sourceNodeId
      )

      if (isBidi) {
        const dx = targetX - sourceX
        const dy = targetY - sourceY
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const offset = 12
        const nx = -dy / len
        const ny = dx / len
        sourceX += nx * offset
        sourceY += ny * offset
        targetX += nx * offset
        targetY += ny * offset
      }

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
  }, [events, nodePositions, currencies, nodeDimensions])

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
        const dx = Math.max(Math.abs(p.targetX - p.sourceX) * 0.55, 60)
        const ctrl1X = p.sourceX + dx
        const ctrl1Y = p.sourceY
        const ctrl2X = p.targetX - dx
        const ctrl2Y = p.targetY

        const t = p.progress
        const invT = 1 - t
        const curX =
          invT * invT * invT * p.sourceX +
          3 * invT * invT * t * ctrl1X +
          3 * invT * t * t * ctrl2X +
          t * t * t * p.targetX
        const curY =
          invT * invT * invT * p.sourceY +
          3 * invT * invT * t * ctrl1Y +
          3 * invT * t * t * ctrl2Y +
          t * t * t * p.targetY

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
