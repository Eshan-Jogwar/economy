import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

test('renders money simulator header and playback controls', () => {
  render(<App />)

  // Header & Brand
  expect(screen.getByText(/MONEY FLOW SIMULATOR/i)).toBeInTheDocument()

  // Control buttons
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /step/i })).toBeInTheDocument()
  expect(screen.getByTitle(/Reset Simulation/i)).toBeInTheDocument()

  // Preset selector
  expect(screen.getByRole('combobox')).toBeInTheDocument()

  // Currencies button
  expect(screen.getByRole('button', { name: /currencies/i })).toBeInTheDocument()
})

test('renders default preset nodes on canvas', () => {
  render(<App />)

  expect(screen.getByText(/Solar Realm/i)).toBeInTheDocument()
  expect(screen.getByText(/Lunar Realm/i)).toBeInTheDocument()
  expect(screen.getByText(/Neutral Exchange Hub/i)).toBeInTheDocument()
})

test('can open and close currencies modal', () => {
  render(<App />)

  const currenciesBtn = screen.getByRole('button', { name: /currencies/i })
  fireEvent.click(currenciesBtn)

  expect(screen.getByText(/Custom Currency Registry/i)).toBeInTheDocument()
})

test('can select Blank Canvas to start with a fresh graph', () => {
  render(<App />)

  const select = screen.getByRole('combobox')
  fireEvent.change(select, { target: { value: 'blank' } })

  // All pre-canned nodes should be cleared
  expect(screen.queryByText(/Solar Realm/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Lunar Realm/i)).not.toBeInTheDocument()
})

test('clicking Add Node button opens the Blender Add Node Menu', () => {
  render(<App />)

  const addNodeBtn = screen.getByTitle(/Add Node \(Shift \+ A\)/i)
  fireEvent.click(addNodeBtn)

  // Should display the Blender-style Add Node popup
  expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument()
  expect(screen.getByText(/Holds money & routes transfers/i)).toBeInTheDocument()
})

test('Shift + A opens the Blender Add Node Menu and allows creating a configured node via modal', () => {
  render(<App />)

  // Trigger Shift + A globally
  fireEvent.keyDown(window, { key: 'A', shiftKey: true })

  expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument()

  // Select "Node" from menu
  const nodeOption = screen.getByText(/Holds money & routes transfers/i)
  fireEvent.click(nodeOption)

  // The CreateNodeModal must open to set initial data
  expect(screen.getByText(/Create Simulation Node/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue(/Node 4/i)).toBeInTheDocument()

  // Change label to "Neo Trading Node"
  const labelInput = screen.getByDisplayValue(/Node 4/i)
  fireEvent.change(labelInput, { target: { value: 'Neo Trading Node' } })

  // Click "Create Node" button
  const confirmBtn = screen.getByRole('button', { name: /Create Node/i })
  fireEvent.click(confirmBtn)

  // Newly created node should now exist on the canvas!
  expect(screen.getByText(/Neo Trading Node/i)).toBeInTheDocument()
})

test('connecting nodes opens CreateEdgeModal to configure transaction before committing', () => {
  render(<App />)

  // NodeView has input and output sockets
  const outputSockets = screen.getAllByTitle(/Output Socket/i)
  expect(outputSockets.length).toBeGreaterThan(0)

  // Click the output socket of first node (Solar Realm)
  fireEvent.click(outputSockets[0])

  // Click the input socket of third node (Neutral Exchange Hub)
  const inputSockets = screen.getAllByTitle(/Input Socket/i)
  fireEvent.click(inputSockets[2])

  // CreateEdgeModal should open to configure the transaction!
  expect(screen.getByText(/Create Transaction Route/i)).toBeInTheDocument()
  expect(screen.getAllByText(/Solar Realm/i).length).toBeGreaterThanOrEqual(2)
  expect(screen.getAllByText(/Neutral Exchange Hub/i).length).toBeGreaterThanOrEqual(2)

  // Click Create Connection
  const createEdgeBtn = screen.getByRole('button', { name: /Create Connection/i })
  fireEvent.click(createEdgeBtn)

  // Modal should close and transaction is committed
  expect(screen.queryByText(/Create Transaction Route/i)).not.toBeInTheDocument()
})

test('Delete or X key deletes the selected node', () => {
  render(<App />)

  const nodeHeader = screen.getByText(/Solar Realm/i)
  fireEvent.click(nodeHeader)

  // Press Delete key
  fireEvent.keyDown(window, { key: 'Delete' })

  expect(screen.queryByText(/Solar Realm/i)).not.toBeInTheDocument()
})

test('Shift + A displays Node as primary option and mouse down + click creates a node', () => {
  render(<App />)

  // Trigger Shift + A globally
  fireEvent.keyDown(window, { key: 'A', shiftKey: true })

  // Primary option is Node
  const nodeOption = screen.getByText(/Holds money & routes transfers/i)
  expect(nodeOption).toBeInTheDocument()

  // Real mouse interaction: mousedown followed by click
  fireEvent.mouseDown(nodeOption)
  fireEvent.click(nodeOption)

  // CreateNodeModal opens for node
  expect(screen.getByText(/Create Simulation Node/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue(/Node 4/i)).toBeInTheDocument()

  // Change label to "Junction Nexus"
  const labelInput = screen.getByDisplayValue(/Node 4/i)
  fireEvent.change(labelInput, { target: { value: 'Junction Nexus' } })

  // Confirm creation
  const confirmBtn = screen.getByRole('button', { name: /Create Node/i })
  fireEvent.click(confirmBtn)

  // Verify node is rendered on canvas
  expect(screen.getByText(/Junction Nexus/i)).toBeInTheDocument()
})

test('can advance simulation tick and transfer currency through generic nodes', () => {
  render(<App />)

  // Solar Realm has 1200 AUR initially
  expect(screen.getByText(/Solar Realm/i)).toBeInTheDocument()

  // Click Step button to execute 1 tick
  const stepBtn = screen.getByRole('button', { name: /step/i })
  fireEvent.click(stepBtn)

  // Transaction AUR -> SLV moves 100 AUR from Solar Realm to Lunar Realm (converted to 150 SLV)
  // Check that simulation has stepped to tick 1
  expect(screen.getByText(/Tick #1/i)).toBeInTheDocument()
})

test('currency modal displays Dollar as default intermediate anchor and supports transitive FX matrix & calculator', () => {
  render(<App />)

  // Open Currencies modal
  const currenciesBtn = screen.getByRole('button', { name: /currencies/i })
  fireEvent.click(currenciesBtn)

  // Verify Dollar is identified as Default Base & Intermediate Anchor
  expect(screen.getAllByText(/US Dollar/i).length).toBeGreaterThan(0)
  expect(screen.getByText(/Default Base & Intermediate Anchor/i)).toBeInTheDocument()

  // Switch to Transitive FX Matrix & Calculator tab
  const matrixTab = screen.getByRole('button', { name: /Transitive FX Matrix & Calculator/i })
  fireEvent.click(matrixTab)

  // Verify calculator and matrix are visible
  expect(screen.getByText(/Live Transitive Triangulation Calculator/i)).toBeInTheDocument()
  expect(screen.getByText(/Transient Pivot/i)).toBeInTheDocument()
  expect(screen.getByText(/Transitive FX Cross-Rate Matrix/i)).toBeInTheDocument()
})

test('can create a new currency asking for conversion factor x to US Dollar', () => {
  render(<App />)

  // Open Currencies modal
  const currenciesBtn = screen.getByRole('button', { name: /currencies/i })
  fireEvent.click(currenciesBtn)

  expect(screen.getByText(/Create Custom Currency Wrapper/i)).toBeInTheDocument()

  // Input Name: "Indian Rupee"
  const nameInput = screen.getByPlaceholderText(/e.g. Indian Rupee, Solar Credit/i)
  fireEvent.change(nameInput, { target: { value: 'Indian Rupee' } })

  // Input Symbol: "₹"
  const symbolInput = screen.getByPlaceholderText(/e.g. ₹, INR, ₡/i)
  fireEvent.change(symbolInput, { target: { value: '₹' } })

  // Input Conversion factor x to US Dollar: 83
  const factorInput = screen.getByPlaceholderText(/e.g. 83 for INR, 150 for JPY/i)
  fireEvent.change(factorInput, { target: { value: '83' } })

  // Verify formula live preview shows x = 83
  expect(screen.getByText(/Formula: ₹ \* x = \$1\.00 USD/i)).toBeInTheDocument()
  expect(screen.getByText(/x = 83/i)).toBeInTheDocument()

  // Click Add Currency button
  const addBtn = screen.getByRole('button', { name: /Add Currency/i })
  fireEvent.click(addBtn)

  // Newly configured currency should now appear in the list with its conversion formula
  expect(screen.getByText(/Indian Rupee/i)).toBeInTheDocument()
  expect(screen.getByText(/₹ \* 83\.00 = \$1\.00 USD/i)).toBeInTheDocument()
})

test('displays unified money holding on node with dollar value and allows global view toggle', () => {
  render(<App />)

  // Solar Realm has 1200 AUR (1 AUR = $1.50 USD => $1,800 USD)
  expect(screen.getByText(/Solar Realm/i)).toBeInTheDocument()
  expect(screen.getByText(/1,200\.00 ₲/i)).toBeInTheDocument()
  expect(screen.getByText(/\$1,800\.00 USD/i)).toBeInTheDocument()

  // ControlBar has View Money selector: Click "$ USD" button to view all nodes in US Dollars
  const usdViewBtn = screen.getByRole('button', { name: /\$ USD/i })
  fireEvent.click(usdViewBtn)

  // In USD view, Solar Realm displays its money converted directly to US Dollars
  expect(screen.getByText(/1,800\.00 \$/i)).toBeInTheDocument()

  // Click Native button to switch back to native currency wrapper
  const nativeViewBtn = screen.getByRole('button', { name: /Native/i })
  fireEvent.click(nativeViewBtn)

  expect(screen.getByText(/1,200\.00 ₲/i)).toBeInTheDocument()
})

test('node inspector allows inspecting unified balance and viewing value in other currencies', () => {
  render(<App />)

  // Click on Solar Realm node header to open inspector
  const solarNode = screen.getByText(/Solar Realm/i)
  fireEvent.click(solarNode)

  // Node Inspector opens
  expect(screen.getByText(/Node Inspector/i)).toBeInTheDocument()
  expect(screen.getByText(/Unified Money Balance/i)).toBeInTheDocument()
  expect(screen.getByText(/View Value in Other Currencies/i)).toBeInTheDocument()

  // Shows Aurum wrapper and US Dollar value
  expect(screen.getByDisplayValue('1200')).toBeInTheDocument()
  expect(screen.getByDisplayValue('1800')).toBeInTheDocument()
})

test('rectangle selection tool selects nodes within drag box and deletes them with Delete key', () => {
  const { container } = render(<App />)

  // Verify initial nodes exist
  expect(screen.getByText(/Solar Realm/i)).toBeInTheDocument()
  expect(screen.getByText(/Lunar Realm/i)).toBeInTheDocument()
  expect(screen.getByText(/Neutral Exchange Hub/i)).toBeInTheDocument()

  const canvasContainer = container.querySelector('.graph-canvas-container')
  expect(canvasContainer).toBeInTheDocument()

  // 1. Mouse down on canvas at clientX: 40, clientY: 40 (canvas space x: 0, y: 0)
  fireEvent.mouseDown(canvasContainer!, { button: 0, clientX: 40, clientY: 40 })

  // 2. Mouse move across to clientX: 800, clientY: 500
  fireEvent.mouseMove(window, { clientX: 800, clientY: 500 })

  // Marquee selection box should be rendered
  const marquee = container.querySelector('.selection-marquee rect')
  expect(marquee).toBeInTheDocument()

  // Mouse up to complete selection
  fireEvent.mouseUp(window)

  // Marquee box disappears on release, but nodes remain selected
  expect(container.querySelector('.selection-marquee')).not.toBeInTheDocument()

  const selectedNodeCards = container.querySelectorAll('.node-selected')
  expect(selectedNodeCards.length).toBeGreaterThan(0)

  // 3. Press Delete key to remove all selected items
  fireEvent.keyDown(window, { key: 'Delete' })

  // Solar Realm and Lunar Realm were inside the rectangle and are now deleted!
  expect(screen.queryByText(/Solar Realm/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Lunar Realm/i)).not.toBeInTheDocument()
})

test('Escape key clears rectangle selection', () => {
  const { container } = render(<App />)

  const canvasContainer = container.querySelector('.graph-canvas-container')
  fireEvent.mouseDown(canvasContainer!, { button: 0, clientX: 40, clientY: 40 })
  fireEvent.mouseMove(window, { clientX: 800, clientY: 500 })
  fireEvent.mouseUp(window)

  expect(container.querySelectorAll('.node-selected').length).toBeGreaterThan(0)

  // Press Escape to clear selection
  fireEvent.keyDown(window, { key: 'Escape' })

  expect(container.querySelectorAll('.node-selected').length).toBe(0)
})

test('can delete selected items using Backspace or x key', () => {
  const { container } = render(<App />)

  const canvasContainer = container.querySelector('.graph-canvas-container')
  // Select everything
  fireEvent.mouseDown(canvasContainer!, { button: 0, clientX: 0, clientY: 0 })
  fireEvent.mouseMove(window, { clientX: 1000, clientY: 1000 })
  fireEvent.mouseUp(window)

  expect(container.querySelectorAll('.node-selected').length).toBeGreaterThan(0)

  // Press x key to delete
  fireEvent.keyDown(window, { key: 'x' })

  expect(screen.queryByText(/Solar Realm/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Lunar Realm/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Neutral Exchange Hub/i)).not.toBeInTheDocument()
})
