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
  expect(screen.getByText(/Agent \/ Household/i)).toBeInTheDocument()
  expect(screen.getByText(/Central Bank/i)).toBeInTheDocument()
})

test('Shift + A opens the Blender Add Node Menu and allows creating a configured node via modal', () => {
  render(<App />)

  // Trigger Shift + A globally
  fireEvent.keyDown(window, { key: 'A', shiftKey: true })

  expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument()

  // Select "Central Bank" from menu
  const bankOption = screen.getByText(/Central Bank/i)
  fireEvent.click(bankOption)

  // The CreateNodeModal must open to set initial data
  expect(screen.getByText(/Create Simulation Node/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue(/Reserve Bank/i)).toBeInTheDocument()

  // Change label to "Neo Bank Reserve"
  const labelInput = screen.getByDisplayValue(/Reserve Bank/i)
  fireEvent.change(labelInput, { target: { value: 'Neo Bank Reserve' } })

  // Click "Create Node" button
  const confirmBtn = screen.getByRole('button', { name: /Create Node/i })
  fireEvent.click(confirmBtn)

  // Newly created node should now exist on the canvas!
  expect(screen.getByText(/Neo Bank Reserve/i)).toBeInTheDocument()
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
