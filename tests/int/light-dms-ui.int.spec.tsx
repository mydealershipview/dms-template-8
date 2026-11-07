import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AddVehicle from '@/lightdms/AddVehicle'
import Workspace from '@/lightdms/Workspace'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
const me = {
  user: { name: 'Dealer', email: null },
  dealer: { name: 'Demo dealership' },
  channels: [],
  feeds: [],
  counts: { all: 1, available: 1, dueIn: 0, sold: 0, saleInProgress: 0 },
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify({ success: status < 400, ...(body as object) }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
describe('stock workspace interactions', () => {
  it('loads the stock list and submits status and search filters to the narrow API', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url)
        return json(
          url.endsWith('/me')
            ? me
            : {
                vehicles: [
                  {
                    stockId: 'car1',
                    registration: 'AB12CDE',
                    make: 'Ford',
                    model: 'Focus',
                    status: 'AVAILABLE',
                    advertPrice: 12000,
                    imageCount: 0,
                  },
                ],
                pagination: { totalPages: 1, totalResults: 1 },
              },
        )
      }),
    )
    render(<Workspace />)
    await screen.findByText('Ford Focus')
    const disclosure = screen.queryByText(/Vehicle information · valuations/)
    if (disclosure) fireEvent.click(disclosure)
    fireEvent.click(screen.getByRole('button', { name: /^Sold\b/ }))
    await waitFor(() => expect(calls.some((url) => url.includes('status=SOLD'))).toBe(true))
    fireEvent.change(screen.getByLabelText('Search stock'), { target: { value: 'AB12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(calls.some((url) => url.includes('search=AB12'))).toBe(true))
  })
  it('shows an API failure instead of reporting empty stock', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'Stock unavailable' }, 503)),
    )
    render(<Workspace />)
    expect((await screen.findByRole('alert')).textContent).toContain('Stock unavailable')
    expect(screen.queryByText('No cars found')).toBeNull()
  })
  it('retries a failed add with the same ID and payload', async () => {
    const adds: Record<string, unknown>[] = []
    const onAdded = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('vehicle-lookup'))
          return json({ vehicle: { make: 'Ford', model: 'Focus' }, alreadyInStock: null })
        adds.push(JSON.parse(String(init.body)))
        return adds.length === 1
          ? json({ error: 'Timeout' }, 504)
          : json({ stockId: 'created1', warning: 'History needs retry' })
      }),
    )
    render(<AddVehicle me={me} onAdded={onAdded} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Registration/), { target: { value: 'AB12CDE' } })
    fireEvent.change(screen.getByLabelText(/Mileage/), { target: { value: '42000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find vehicle' }))
    await screen.findByText('Ford Focus')
    const disclosure = screen.queryByText(/Vehicle information · valuations/)
    if (disclosure) fireEvent.click(disclosure)
    if (screen.queryByRole('button', { name: /Review listing/ }))
      fireEvent.click(screen.getByRole('button', { name: /Review listing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to stock' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Retry original add' }))
    await waitFor(() => expect(onAdded).toHaveBeenCalledWith('created1', 'History needs retry'))
    expect(adds).toHaveLength(2)
    expect(adds[0]).toEqual(adds[1])
    expect(adds[0].addRequestId).toMatch(/^[a-f0-9-]{36}$/)
  })
})
