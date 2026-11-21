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
