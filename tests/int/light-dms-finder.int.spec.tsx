import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AddVehicle from '@/lightdms/AddVehicle'
import VehicleInsights from '@/lightdms/VehicleInsights'
import VehicleEditor from '@/lightdms/VehicleEditor'
import type { FinderInsights } from '@/lightdms/finderTypes'
import type { Vehicle } from '@/lightdms/types'
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify({ success: status < 400, ...(body as object) }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
const insights: FinderInsights = {
  source: 'AutoTrader',
  fetchedAt: '2026-10-17T10:00:00Z',
  warnings: [],
  valuations: [
    { type: 'retail', label: 'Retail', amountGBP: 15000, vatBasis: 'No VAT' },
    { type: 'private', label: 'Private sale', amountGBP: null, vatBasis: null },
  ],
  motTests: [
    {
      completedDate: '2026-01-15',
      testResult: 'PASSED',
      expiryDate: '2027-01-14',
      odometerValue: '42000',
      odometerUnit: 'mi',
      defects: [{ text: 'Tyre worn', type: 'ADVISORY', dangerous: false }],
    },
  ],
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe('Light DMS vehicle finder', () => {
  it('shows valuations and MOT results without sending them back in the add payload', async () => {
    const writes: Record<string, unknown>[] = [],
      added = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('vehicle-lookup'))
          return json({
            vehicle: { make: 'Ford', model: 'Focus', derivative: 'Titanium' },
            alreadyInStock: null,
            insights,
          })
        if (url.includes('vehicle-check'))
          return json({ error: 'Vehicle Check is not included in your package' }, 403)
        writes.push(JSON.parse(String(init.body)))
        return json({ stockId: 'new-car' })
      }),
    )
    render(
      <AddVehicle
        me={{
          user: { name: 'Fixture', email: null },
          dealer: { name: 'Fixture' },
          counts: { all: 0, available: 0, dueIn: 0, saleInProgress: 0, sold: 0 },
          channels: [],
          feeds: [],
        }}
        onClose={vi.fn()}
        onAdded={added}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Registration/), { target: { value: 'AB12CDE' } })
    fireEvent.change(screen.getByLabelText(/Mileage/), { target: { value: '42000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find vehicle' }))
    await screen.findByText('Ford Focus')
    const disclosure = screen.queryByText(/Vehicle information · valuations/)
    if (disclosure) fireEvent.click(disclosure)
    expect(screen.getByText('£15,000.00')).toBeTruthy()
    expect(screen.getByText('Unavailable')).toBeTruthy()
    expect(screen.getByText('Tyre worn')).toBeTruthy()
    expect(screen.getByText('15/01/2026')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Load vehicle check' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Load vehicle check' }))
    await screen.findByRole('alert')
    if (screen.queryByRole('button', { name: /Review listing/ }))
      fireEvent.click(screen.getByRole('button', { name: /Review listing/ }))
    expect(
      (screen.getByRole('button', { name: 'Add to stock' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    if (screen.queryByRole('button', { name: /Review listing/ }))
      fireEvent.click(screen.getByRole('button', { name: /Review listing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to stock' }))
    await waitFor(() => expect(added).toHaveBeenCalledWith('new-car'))
    expect(writes[0]).not.toHaveProperty('insights')
    expect(writes[0]).not.toHaveProperty('valuations')
    expect(writes[0]).not.toHaveProperty('motTests')
    expect(writes[0].vehicle).toEqual({ make: 'Ford', model: 'Focus', derivative: 'Titanium' })
  })
  it('loads a check only on demand, shows unknown fields and retains flagged markers', async () => {
    const fetch = vi.fn(async () =>
      json({
        source: 'AutoTrader',
        fetchedAt: null,
        available: true,
        checks: [
          { key: 'stolen', label: 'Stolen', status: 'clear', detail: null },
          { key: 'finance', label: 'Finance', status: 'flagged', detail: null },
          { key: 'scrapped', label: 'Scrapped', status: 'unknown', detail: null },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetch)
    render(<VehicleInsights insights={insights} registration="AB12CDE" mileage={42000} />)
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Load vehicle check' }))
    await screen.findByText('Flagged')
    expect(screen.getByText('Not flagged')).toBeTruthy()
    expect(screen.getByText('Not supplied')).toBeTruthy()
    expect(fetch.mock.calls).toHaveLength(1)
  })
  it('shows package/upstream check errors while keeping the finder/add available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'Vehicle Check is not included in your package' }, 403)),
    )
    render(<VehicleInsights insights={insights} registration="AB12CDE" mileage={42000} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load vehicle check' }))
    expect((await screen.findByRole('alert')).textContent).toContain('not included')
    expect(screen.getByText('£15,000.00')).toBeTruthy()
    expect(screen.queryByText('Not flagged')).toBeNull()
    expect(screen.getByRole('button', { name: 'Retry vehicle check' })).toBeTruthy()
  })
  it('distinguishes unavailable MOT/defects from genuine empty provider results', () => {
    const { rerender } = render(<VehicleInsights registration="AB12CDE" mileage={42000} />)
    expect(screen.getByText('AutoTrader did not supply MOT history for this lookup.')).toBeTruthy()
    rerender(
      <VehicleInsights
        registration="AB12CDE"
        mileage={42000}
        insights={{ ...insights, motTests: [] }}
      />,
    )
    expect(screen.getByText('AutoTrader returned no MOT tests for this vehicle.')).toBeTruthy()
    rerender(
      <VehicleInsights
        registration="AB12CDE"
        mileage={42000}
        insights={{ ...insights, motTests: [{ ...insights.motTests![0], defects: null }] }}
      />,
    )
    expect(screen.getByText('Defect details were not supplied.')).toBeTruthy()
    expect(screen.queryByText('No defects or advisories returned for this test.')).toBeNull()
  })
  it('opens an existing car instead of offering to add a duplicate', async () => {
    const open = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json({
          vehicle: { make: 'Ford', model: 'Focus' },
          insights,
          alreadyInStock: { stockId: 'existing', status: 'AVAILABLE' },
        }),
      ),
    )
    render(
      <AddVehicle
        me={{
          user: { name: 'Fixture', email: null },
          dealer: { name: 'Fixture' },
          counts: { all: 0, available: 0, dueIn: 0, saleInProgress: 0, sold: 0 },
          channels: [],
          feeds: [],
        }}
        onClose={vi.fn()}
        onAdded={vi.fn()}
        onOpenExisting={open}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Registration/), { target: { value: 'AB12CDE' } })
    fireEvent.change(screen.getByLabelText(/Mileage/), { target: { value: '42000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find vehicle' }))
    await screen.findByText('Ford Focus')
    const disclosure = screen.queryByText(/Vehicle information · valuations/)
    if (disclosure) fireEvent.click(disclosure)
    expect(screen.queryByRole('button', { name: 'Add to stock' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open existing vehicle' }))
    expect(open).toHaveBeenCalledWith('existing')
  })
  it('defers stock-vehicle information until selected and reuses it on return', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url)
        return json(
          url.includes('vehicle-lookup')
            ? {
                insights,
                vehicle: { make: 'Ford', model: 'Focus' },
                alreadyInStock: { stockId: 'car1', status: 'AVAILABLE' },
              }
            : {
                vehicle: {
                  stockId: 'car1',
                  registration: 'AB12CDE',
                  make: 'Ford',
                  model: 'Focus',
                  status: 'AVAILABLE',
                  mileage: 42000,
                  advertPrice: 12000,
                  vatStatus: 'No VAT',
                  images: [],
                  channels: {},
                  feeds: [],
                } as unknown as Vehicle,
              },
        )
      }),
    )
    render(
      <VehicleEditor
        stockId="car1"
        me={{
          user: { name: 'Fixture', email: null },
          dealer: { name: 'Fixture' },
          counts: { all: 0, available: 0, dueIn: 0, saleInProgress: 0, sold: 0 },
          channels: [],
          feeds: [],
        }}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await screen.findByRole('button', { name: 'Manage photos' })
    expect(calls).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /^Vehicle information/ }))
    await screen.findByText('£15,000.00')
    expect(calls).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /^Overview/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Vehicle information/ }))
    await screen.findByText('£15,000.00')
    expect(calls).toHaveLength(2)
  })
  it('warns when entered mileage is below the latest supplied MOT reading', () => {
    render(<VehicleInsights registration="AB12CDE" mileage={20000} insights={insights} />)
    expect(
      screen.getByText(/mileage entered is below the latest MOT reading/).textContent,
    ).toContain('42,000 miles')
  })
  it('removes an old clear result when reloading the check fails', async () => {
    let calls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ++calls === 1
          ? json({
              available: true,
              checks: [{ key: 'stolen', label: 'Stolen', status: 'clear', detail: null }],
            })
          : json({ error: 'Check unavailable' }, 503),
      ),
    )
    render(<VehicleInsights registration="AB12CDE" mileage={42000} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load vehicle check' }))
    await screen.findByText('Not flagged')
    fireEvent.click(screen.getByRole('button', { name: 'Reload check' }))
    await screen.findByRole('alert')
    expect(screen.queryByText('Not flagged')).toBeNull()
  })
})
