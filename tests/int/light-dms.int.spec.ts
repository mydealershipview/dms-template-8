// These tests mock the DMS and Payload. No real database or provider writes.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({
  session: 'session',
  calls: [] as string[],
  failDms: false,
  failArchive: false,
}))
vi.mock('@/lightdms/session', () => ({
  getSessionToken: async () => state.session || null,
  clearSession: vi.fn(),
}))
vi.mock('@/utilities/vehicleInventory', () => ({ invalidateInventory: vi.fn() }))
vi.mock('@/lightdms/websiteData', () => ({
  getHighlight: async () => 'Website highlight',
  archiveSoldCar: async (snapshot: Record<string, unknown>) => {
    state.calls.push('archive')
    expect(snapshot).not.toHaveProperty('vin')
    return { id: 'archive-1', created: true }
  },
  confirmSoldSnapshot: async () => {
    state.calls.push('confirm')
    if (state.failArchive) throw new Error('archive confirmation failed')
  },
}))
vi.mock('@/lightdms/dms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lightdms/dms')>()),
  dmsJson: async (path: string, init: { method?: string } = {}) => {
    if (init.method === 'PATCH') {
      state.calls.push('DMS')
      if (state.failDms) throw new Error('network timeout')
      return { success: true }
    }
    if (path.endsWith('/me')) return { user: { email: 'admin@example.test', name: 'Admin' } }
    return {
      vehicle: {
        stockId: 'car-1',
        make: 'Ford',
        model: 'Focus',
        images: [{ url: 'https://m.atcdn.co.uk/car.jpg' }],
      },
    }
  },
}))
import { POST } from '@/app/api/admin/vehicles/[stockId]/status/route'
const params = { params: Promise.resolve({ stockId: 'car-1' }) }
const request = (body: unknown, origin = 'http://localhost:3000') =>
  new NextRequest('http://localhost:3000/api/admin/vehicles/car-1/status', {
    method: 'POST',
    headers: { origin, 'x-lightdms': '1', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
beforeEach(() => {
  state.calls = []
  state.session = 'session'
  state.failDms = false
  state.failArchive = false
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3000')
})
describe('website sold archive and immediate visibility', () => {
  it('archives public data before sending Sold, then confirms the archive', async () => {
    const response = await POST(
      request({ status: 'SOLD', soldDate: '2026-10-01', keepOnSoldPage: true }),
      params,
    )
    expect(response.status).toBe(200)
    expect(state.calls).toEqual(['archive', 'DMS', 'confirm'])
  })
  it('preserves the pending snapshot if a DMS timeout leaves the outcome unknown', async () => {
    state.failDms = true
    expect((await POST(request({ status: 'SOLD', keepOnSoldPage: true }), params)).status).toBe(500)
    expect(state.calls).toEqual(['archive', 'DMS'])
  })
  it('returns a warning when the DMS succeeded but archive confirmation failed', async () => {
    state.failArchive = true
    const response = await POST(request({ status: 'SOLD', keepOnSoldPage: true }), params)
    expect(response.status).toBe(200)
    expect((await response.json()).warning).toMatch(/DMS status was saved/)
  })
  it('does not archive a sale when the user opts out', async () => {
    await POST(request({ status: 'SOLD', keepOnSoldPage: false }), params)
    expect(state.calls).toEqual(['DMS'])
  })
  it('delegates deletion and availability to the DMS without persistent website hides', async () => {
    await POST(request({ status: 'DELETED' }), params)
    await POST(request({ status: 'AVAILABLE' }), params)
    expect(state.calls).toEqual(['DMS', 'DMS'])
  })
  it('rejects unauthenticated and cross-site mutations before doing any work', async () => {
    state.session = ''
    expect((await POST(request({ status: 'SOLD' }), params)).status).toBe(401)
    state.session = 'session'
    expect((await POST(request({ status: 'SOLD' }, 'https://evil.example'), params)).status).toBe(
      403,
    )
    expect(state.calls).toEqual([])
  })
})
