import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({
  session: 'fixture-session',
  fetcher: vi.fn(),
  invalidated: vi.fn(),
  me: vi.fn(),
  getPayload: vi.fn(),
}))
vi.mock('@/lightdms/session', () => ({
  getSessionToken: async () => state.session || null,
  clearSession: vi.fn(),
}))
vi.mock('@/utilities/vehicleInventory', () => ({ invalidateInventory: state.invalidated }))
vi.mock('@/lightdms/dms', async (original) => ({
  ...(await original<typeof import('@/lightdms/dms')>()),
  dmsFetch: state.fetcher,
  dmsJson: state.me,
}))
vi.mock('payload', () => ({ getPayload: state.getPayload }))
vi.mock('@payload-config', () => ({ default: {} }))
import { GET, POST, PATCH } from '@/app/api/admin/dms/[...path]/route'
import { GET as archive } from '@/app/api/admin/sold/route'
const request = (path: string, method = 'GET', body?: unknown, origin = 'https://dealer.test') =>
  new NextRequest(`https://dealer.test/api/admin/dms/${path}`, {
    method,
    headers: { Origin: origin, 'x-lightdms': '1', 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
const params = (...path: string[]) => ({ params: Promise.resolve({ path }) })
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://dealer.test')
  state.session = 'fixture-session'
  state.fetcher.mockReset().mockResolvedValue(Response.json({ success: true }))
  state.invalidated.mockReset()
  state.me.mockReset()
  state.getPayload.mockReset()
})
afterEach(() => vi.unstubAllEnvs())
describe('narrow staff boundaries and cache invalidation', () => {
  it('denies anonymous routes, cross-site changes and unlisted methods/paths', async () => {
    state.session = ''
    expect((await GET(request('stock'), params('stock'))).status).toBe(401)
    state.session = 'fixture-session'
    expect(
      (await POST(request('stock', 'POST', {}, 'https://attacker.test'), params('stock'))).status,
    ).toBe(403)
    for (const path of [['customers'], ['stock', 'one', 'status'], ['stock', 'one', 'anything']])
      expect((await PATCH(request(path.join('/'), 'PATCH', {}), params(...path))).status).toBe(404)
    expect(state.fetcher).not.toHaveBeenCalled()
  })
  it('does not allow client dealer selection, arbitrary query or JSON properties', async () => {
    expect((await GET(request('stock?dealerId=forged'), params('stock'))).status).toBe(400)
    expect(
      (
        await PATCH(
          request('stock/one/price', 'PATCH', { price: 1000, dealerId: 'forged' }),
          params('stock', 'one', 'price'),
        )
      ).status,
    ).toBe(400)
    expect(state.fetcher).not.toHaveBeenCalled()
  })
  it.each([true, false])(
    'invalidates inventory after a mutation including uncertain failure (%s)',
    async (success) => {
      if (!success) state.fetcher.mockRejectedValue(new Error('timeout after write'))
      const response = await PATCH(
        request('stock/one/price', 'PATCH', { price: 1000 }),
        params('stock', 'one', 'price'),
      )
      expect(response.status).toBe(success ? 200 : 500)
      expect(state.invalidated).toHaveBeenCalledTimes(1)
    },
  )
  it('validates the DMS session before any local privileged archive read', async () => {
    state.me.mockRejectedValue(new Error('revoked'))
    expect((await archive(request('sold'))).status).toBe(500)
    expect(state.getPayload).not.toHaveBeenCalled()
  })
})
