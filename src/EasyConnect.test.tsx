import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import EasyConnectExample from './EasyConnectExample'
import CustomNode from './CustomNode'
import CustomConnectionLine from './CustomConnectionLine'
import FloatingEdge from './FloatingEdge'
import { getNodeIntersection, getEdgePosition, getEdgeParams } from './utils'
import { Position } from '@xyflow/react'

describe('Easy Connect Math Utilities', () => {
  test('calculates correct intersection point for horizontal nodes', () => {
    const nodeA = {
      position: { x: 0, y: 0 },
      measured: { width: 100, height: 100 },
    }
    const nodeB = {
      position: { x: 300, y: 0 },
      measured: { width: 100, height: 100 },
    }

    const intersection = getNodeIntersection(nodeA as any, nodeB as any)
    // Node A is at [0, 100]x[0, 100], center is (50, 50).
    // Node B is to the right, so intersection should be on right border x = 100, y = 50.
    expect(intersection.x).toBeCloseTo(100)
    expect(intersection.y).toBeCloseTo(50)

    const pos = getEdgePosition(nodeA as any, intersection)
    expect(pos).toBe(Position.Right)
  })

  test('calculates correct intersection point for vertical nodes', () => {
    const nodeA = {
      position: { x: 0, y: 0 },
      measured: { width: 100, height: 100 },
    }
    const nodeB = {
      position: { x: 0, y: 300 },
      measured: { width: 100, height: 100 },
    }

    const intersection = getNodeIntersection(nodeA as any, nodeB as any)
    // Node B is below, so intersection should be on bottom border y = 100, x = 50.
    expect(intersection.x).toBeCloseTo(50)
    expect(intersection.y).toBeCloseTo(100)

    const pos = getEdgePosition(nodeA as any, intersection)
    expect(pos).toBe(Position.Bottom)
  })

  test('getEdgeParams returns source and target coordinates with positions', () => {
    const nodeA = {
      position: { x: 0, y: 0 },
      measured: { width: 100, height: 100 },
    }
    const nodeB = {
      position: { x: 200, y: 0 },
      measured: { width: 100, height: 100 },
    }

    const params = getEdgeParams(nodeA as any, nodeB as any)
    expect(params.sx).toBeCloseTo(100)
    expect(params.sy).toBeCloseTo(50)
    expect(params.tx).toBeCloseTo(200)
    expect(params.ty).toBeCloseTo(50)
    expect(params.sourcePos).toBe(Position.Right)
    expect(params.targetPos).toBe(Position.Left)
  })
})

describe('CustomConnectionLine Component', () => {
  test('renders line with directional arrowhead pointing to connection target', () => {
    const { container } = render(
      <svg>
        <CustomConnectionLine
          fromX={50}
          fromY={50}
          toX={200}
          toY={100}
          connectionLineStyle={{ stroke: '#38bdf8' }}
          fromNode={{} as any}
          fromHandle={{} as any}
          connectionStatus={null}
          toHandle={null}
          toNode={null}
          fromPosition={Position.Right}
          toPosition={Position.Left}
        />
      </svg>
    )

    // Should render a custom connection line path and arrowhead polygon
    const linePath = container.querySelector('path')
    expect(linePath).toBeInTheDocument()

    const arrowPolygon = container.querySelector('polygon')
    expect(arrowPolygon).toBeInTheDocument()
    expect(arrowPolygon).toHaveAttribute('points', '-12,-6 0,0 -12,6 -8,0')
  })
})

describe('Easy Connect Example in App', () => {
  test('can select Easy Connect preset in preset dropdown', () => {
    render(<App />)

    const presetSelect = screen.getByRole('combobox')
    fireEvent.change(presetSelect, { target: { value: 'easy-connect-example' } })

    // Node 1, 2, 3, 4 from EasyConnectExample should be present
    expect(screen.getByText(/Node 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 3/i)).toBeInTheDocument()
    expect(screen.getByText(/Node 4/i)).toBeInTheDocument()
  })

  test('nodes in simulation canvas provide Easy Connect button with flow arrow', () => {
    render(<App />)

    const connectBtns = screen.getAllByRole('button', { name: /Connect ➔/i })
    expect(connectBtns.length).toBeGreaterThanOrEqual(3)

    // Clicking Connect ➔ starts easy connect mode
    fireEvent.click(connectBtns[0])

    // Target feedback banner should appear on other nodes
    expect(screen.getAllByText(/Drop here to connect/i).length).toBeGreaterThanOrEqual(1)
  })

  test('edges display directional flow arrows indicating direction from source to target', () => {
    const { container } = render(<App />)

    // Markers with arrowId should exist in SVG defs
    const markers = container.querySelectorAll('marker[id^="arrow-"]')
    expect(markers.length).toBeGreaterThan(0)

    // Edge label badge displays flow arrow symbol ➔
    expect(screen.getByText(/➔ 100 ₲/i)).toBeInTheDocument()
  })
})
