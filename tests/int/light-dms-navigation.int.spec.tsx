import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Workspace from '@/lightdms/Workspace'
import VehicleEditor from '@/lightdms/VehicleEditor'
import { imageUrl } from '@/lightdms/ui'
import type { Me, Vehicle } from '@/lightdms/types'
const me: Me = {
  user: { name: 'Dealer', email: null },
  dealer: { name: 'Demo' },
  channels: [{ key: 'advertiserAdvert', label: 'Website' }],
  feeds: [],
  counts: { all: 1, available: 1, dueIn: 0, sold: 0, saleInProgress: 0 },
}
const car: Vehicle = {
  stockId: 'car1',
  registration: 'AB12CDE',
  make: 'Ford',
  model: 'Focus',
  derivative: 'Titanium',
  year: 2020,
  mileage: 42000,
  status: 'AVAILABLE',
  inPrep: false,
  price: null,
  advertPrice: null,
  vatStatus: null,
  thumbnail: null,
  imageCount: 2,
  channels: { advertiserAdvert: true },
  attentionGrabber: 'Great condition',
  description: '',
  images: [
    { imageId: 'one', url: 'https://m.atcdn.co.uk/a/w800h600/one.jpg' },
    { imageId: 'two', url: 'https://m.atcdn.co.uk/a/w800h600/two.jpg' },
  ],
  feeds: [],
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify({ success: status < 400, ...(body as object) }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/admin')
})
describe('light workspace navigation and request budget', () => {
  it('loads profile once, reuses recent stock filters, and invalidates on refresh', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url)
        return json(
          url.endsWith('/me')
            ? me
            : { vehicles: [car], pagination: { totalPages: 1, totalResults: 1 } },
        )
      }),
    )
    render(<Workspace />)
    await screen.findByText('Ford Focus')
    fireEvent.click(screen.getByRole('button', { name: /^Sold\b/ }))
    await waitFor(() => expect(calls.filter((x) => x.includes('status=SOLD'))).toHaveLength(1))
    await screen.findByText('Ford Focus')
    fireEvent.click(screen.getByRole('button', { name: /^All stock/ }))
    await screen.findByText('Ford Focus')
    expect(calls.filter((x) => x.endsWith('/me'))).toHaveLength(1)
    expect(calls.filter((x) => x.includes('status=ALL'))).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'List view' }))
    expect(screen.getByRole('table')).toBeTruthy()
    expect(calls).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Refresh stock' }))
    await waitFor(() => expect(calls.filter((x) => x.endsWith('/me'))).toHaveLength(2))
    await waitFor(() => expect(calls.filter((x) => x.includes('status=ALL'))).toHaveLength(2))
  })
  it('aborts stale filter requests and ignores responses that arrive late', async () => {
    let finishOld: ((value: Response) => void) | undefined
    let oldSignal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: RequestInit) => {
        if (url.endsWith('/me')) return Promise.resolve(json(me))
        if (url.includes('status=ALL')) {
          oldSignal = init.signal!
          return new Promise<Response>((resolve) => {
            finishOld = resolve
          })
        }
        return Promise.resolve(
          json({ vehicles: [car], pagination: { totalPages: 1, totalResults: 1 } }),
        )
      }),
    )
    render(<Workspace />)
    await waitFor(() => expect(finishOld).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /^Sold\b/ }))
    await screen.findByText('Ford Focus')
    expect(oldSignal?.aborted).toBe(true)
    finishOld!(json({ vehicles: [], pagination: { totalPages: 0, totalResults: 0 } }))
    await waitFor(() => expect(screen.getByText('Ford Focus')).toBeTruthy())
    expect(screen.queryByText('No cars found')).toBeNull()
  })
  it('defers website data and gallery rendering, guards edits, and saves an empty gallery', async () => {
    const calls: { url: string; init: RequestInit }[] = [],
      saved = vi.fn(),
      close = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init })
        return json(
          url.endsWith('/highlight')
            ? { websiteHighlight: 'One owner' }
            : init.method === 'GET'
              ? { vehicle: car }
              : { success: true },
        )
      }),
    )
    render(<VehicleEditor stockId="car1" me={me} onClose={close} onSaved={saved} />)
    await screen.findByRole('heading', { name: 'Advertised price' })
    expect(calls).toHaveLength(1)
    expect((screen.getByRole('button', { name: 'Save price' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(screen.queryByRole('button', { name: 'Remove photo 1' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Website/ }))
    await waitFor(() =>
      expect((screen.getByLabelText('Line on the vehicle photo') as HTMLInputElement).value).toBe(
        'One owner',
      ),
    )
    expect(calls).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Line on the vehicle photo'), {
      target: { value: 'New highlight' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'My stock' }))
    expect(close).not.toHaveBeenCalled()
    expect(screen.getByText(/You have unsaved changes/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save highlight' }))
    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ websiteHighlight: 'New highlight' })
    fireEvent.click(screen.getByRole('button', { name: /^Photos/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save photo order' }))
    await waitFor(() => expect(calls.some((x) => x.url.endsWith('/images'))).toBe(true))
    expect(JSON.parse(String(calls.find((x) => x.url.endsWith('/images'))!.init.body))).toEqual({
      imageIds: [],
    })
    expect(
      calls.filter((x) => x.url.endsWith('/highlight') && x.init.method === 'GET'),
    ).toHaveLength(1)
  })
  it('preserves price/VAT, channel, and sold-status request contracts', async () => {
    const writes: { url: string; body: unknown }[] = [],
      saved = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (init.method !== 'GET') writes.push({ url, body: JSON.parse(String(init.body)) })
        return json(init.method === 'GET' ? { vehicle: car } : { success: true })
      }),
    )
    render(<VehicleEditor stockId="car1" me={me} onClose={vi.fn()} onSaved={saved} />)
    await screen.findByLabelText('Advertised price (£)')
    fireEvent.change(screen.getByLabelText('Advertised price (£)'), { target: { value: '12000' } })
    fireEvent.change(screen.getByLabelText('Listing VAT status'), { target: { value: 'Ex VAT' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save price' }))
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
    expect(writes[0]).toEqual({
      url: '/api/admin/dms/stock/car1/price',
      body: { price: 12000, vatStatus: 'Ex VAT' },
    })
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'SOLD' } })
    const date = (screen.getByLabelText('Sold date') as HTMLInputElement).value
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }))
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(2))
    expect(writes[1]).toEqual({
      url: '/api/admin/vehicles/car1/status',
      body: { status: 'SOLD', soldDate: date, keepOnSoldPage: true },
    })
    expect(saved).toHaveBeenLastCalledWith('Status updated.', true)
    fireEvent.click(screen.getByRole('button', { name: /^Listings/ }))
    fireEvent.click(screen.getByRole('switch', { name: /Website/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save channels' }))
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(3))
    expect(writes[2]).toEqual({
      url: '/api/admin/dms/stock/car1/channels',
      body: { channels: { advertiserAdvert: false } },
    })
  })
  it('retains successful uploads when a later upload fails', async () => {
    let uploads = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith('/images') && init.method === 'POST') {
          uploads++
          return uploads === 1
            ? json({ imageId: 'three', url: 'https://example.com/three.jpg' })
            : json({ error: 'Upload failed' }, 503)
        }
        return json({ vehicle: car })
      }),
    )
    const { container } = render(
      <VehicleEditor stockId="car1" me={me} onClose={vi.fn()} onSaved={vi.fn()} />,
    )
    await screen.findByRole('button', { name: 'Manage photos' })
    fireEvent.click(screen.getByRole('button', { name: 'Manage photos' }))
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [
          new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
          new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
        ],
      },
    })
    expect((await screen.findByRole('alert')).textContent).toContain('Upload failed')
    expect(screen.getByRole('button', { name: 'Remove photo 3' })).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Save photo order' }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })
  it('keeps CDN image resizing limited to the trusted image CDN', () => {
    expect(imageUrl('https://m.atcdn.co.uk/a/w800h600/car.jpg', 'w480h360')).toContain('/w480h360/')
    expect(imageUrl('https://example.com/a/w800h600/car.jpg', 'w480h360')).toContain('/w800h600/')
  })
})
