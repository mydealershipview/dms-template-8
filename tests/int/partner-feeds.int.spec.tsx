import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AddVehicle from '@/lightdms/AddVehicle'
import PartnerFeeds from '@/lightdms/PartnerFeeds'
import type { Me } from '@/lightdms/types'
const me: Me = {
  user: { name: 'Fixture', email: null },
  dealer: { name: 'Fixture', websiteSoldPage: true },
  counts: { all: 0, available: 0, dueIn: 0, saleInProgress: 0, sold: 0 },
  channels: [{ key: 'advertiserAdvert', label: 'Dealer Website' }],
  feeds: [
    { id: 'aacars', name: 'AA Cars' },
    { id: 'cargurus', name: 'CarGurus' },
    { id: 'feed_partner:local', name: 'Local partner' },
  ],
}
const json = (body: object, status = 200) =>
  Response.json({ success: status < 400, ...body }, { status })
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
async function prepare() {
  fireEvent.change(screen.getByLabelText(/Registration/), { target: { value: 'AB12CDE' } })
  fireEvent.change(screen.getByLabelText(/Mileage/), { target: { value: '42000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Find vehicle' }))
  await screen.findByText('Ford Focus')
  fireEvent.change(screen.getByLabelText(/Advert price/), { target: { value: '10000' } })
}
describe('dynamic subscribed partner feeds', () => {
  it('sends built-ins at creation and retries custom failure without creating another car', async () => {
    const writes: { url: string; body: Record<string, unknown> }[] = []
    let customAttempts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('vehicle-lookup'))
          return json({
            vehicle: { make: 'Ford', model: 'Focus', derivative: 'Titanium' },
            alreadyInStock: null,
          })
        const body = JSON.parse(String(init.body))
        writes.push({ url, body })
        if (url.endsWith('/feeds') && customAttempts++ === 0)
          return json({ error: 'Partner temporarily unavailable' }, 502)
        return json(url.endsWith('/stock') ? { stockId: 'new-stock' } : {})
      }),
    )
    const added = vi.fn()
    render(<AddVehicle me={me} onClose={vi.fn()} onAdded={added} />)
    await prepare()
    fireEvent.click(screen.getByRole('switch', { name: /AA Cars/ }))
    fireEvent.click(screen.getByRole('switch', { name: /CarGurus/ }))
    fireEvent.click(screen.getByRole('switch', { name: /Local partner/ }))
    fireEvent.click(screen.getByRole('button', { name: /Review listing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to stock' }))
    await screen.findByRole('alert')
    expect(writes[0].body.feeds).toEqual({ aacars: true, cargurus: true })
    expect(writes[1].body).toEqual({ feedId: 'feed_partner:local', enabled: true })
    expect(added).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Retry remaining feeds' }))
    await waitFor(() => expect(added).toHaveBeenCalledWith('new-stock'))
    expect(writes.filter((write) => write.url.endsWith('/stock'))).toHaveLength(1)
  })
  it('offers no unsubscribed switches and disables publication during preparation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ vehicle: { make: 'Ford', model: 'Focus' }, alreadyInStock: null })),
    )
    render(<AddVehicle me={{ ...me, feeds: [] }} onClose={vi.fn()} onAdded={vi.fn()} />)
    await prepare()
    expect(screen.queryByRole('switch', { name: /AA Cars/ })).toBeNull()
    expect(screen.getByText(/No partner subscriptions/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText(/Requires preparation/))
    expect(
      (screen.getByRole('switch', { name: /Dealer Website/ }) as HTMLInputElement).disabled,
    ).toBe(true)
  })
  it('preserves a failed selection and confirms each saved feed by reading detail', async () => {
    let enabled = false,
      attempts = 0
    const saved = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith('/feeds')) {
          if (attempts++ === 0) return json({ error: 'Prep publication is blocked' }, 409)
          enabled = JSON.parse(String(init.body)).enabled
          return json({})
        }
        return json({ vehicle: { feeds: [{ id: 'aacars', name: 'AA Cars', enabled }] } })
      }),
    )
    render(
      <PartnerFeeds
        stockId="stock1"
        feeds={[{ id: 'aacars', name: 'AA Cars', enabled: false }]}
        onSaved={saved}
      />,
    )
    fireEvent.click(screen.getByRole('switch', { name: 'AA Cars' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save AA Cars' }))
    await screen.findByText('Prep publication is blocked')
    expect((screen.getByRole('switch', { name: 'AA Cars' }) as HTMLInputElement).checked).toBe(true)
    expect(saved).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save AA Cars' }))
    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(saved.mock.calls[0][0][0].enabled).toBe(true)
  })
})
