// Complete callback orchestration with mocked DMS and cookies; no live sign-in/DB writes.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ setCookie: vi.fn(), exchange: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.setCookie }) }))
vi.mock('@/lightdms/dms', async (original) => ({
  ...(await original<typeof import('@/lightdms/dms')>()),
  dmsJson: mocks.exchange,
}))
import { GET as login } from '@/app/api/admin/auth/login/route'
import { GET as callback } from '@/app/api/admin/auth/callback/route'
import { siteOrigin } from '@/lightdms/config'
import { DmsError } from '@/lightdms/dms'
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('DMS_URL', 'http://localhost:3001')
  vi.stubEnv('DMS_WEBSITE_KEY', 'website-key')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3101')
  mocks.setCookie.mockReset()
  mocks.exchange.mockReset()
  mocks.exchange.mockResolvedValue({
    sessionToken: 'website-session',
    expiresAt: '2030-01-01T00:00:00Z',
  })
})
afterEach(() => vi.unstubAllEnvs())
describe('website sign-in handoff origin and state', () => {
  it.each(['http://localhost:3000', 'http://127.0.0.1:3200'])(
    'returns to the website that initiated local sign-in at %s',
    async (origin) => {
      const start = await login(
        new NextRequest(`${origin}/api/admin/auth/login`, {
          headers: { host: new URL(origin).host },
        }),
      )
      const connect = new URL(start.headers.get('location')!)
      expect(connect.origin).toBe('http://localhost:3001')
      expect(connect.pathname).toBe('/website-admin/connect')
      expect(connect.searchParams.get('redirect_uri')).toBe(`${origin}/api/admin/auth/callback`)
      const state = connect.searchParams.get('state')!
      expect(start.cookies.get('lightdms_state')?.value).toBe(state)
      expect(start.cookies.get('lightdms_state')).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/admin/auth',
      })
      const back = await callback(
        new NextRequest(`${origin}/api/admin/auth/callback?code=fresh-code&state=${state}`, {
          headers: { cookie: `lightdms_state=${state}`, host: new URL(origin).host },
        }),
      )
      expect(mocks.exchange).toHaveBeenCalledWith('/api/website-admin/session', {
        method: 'POST',
        json: { code: 'fresh-code' },
      })
      expect(mocks.setCookie).toHaveBeenCalledWith(
        'lightdms_api_session',
        'website-session',
        expect.objectContaining({ httpOnly: true, path: '/api/admin' }),
      )
      expect(back.headers.get('location')).toBe(`${origin}/admin`)
      expect(back.cookies.get('lightdms_state')?.maxAge).toBe(0)
    },
  )
  it('rejects missing or mismatched state before attempting exchange, on the correct port', async () => {
    for (const cookie of ['', 'lightdms_state=wrong']) {
      const result = await callback(
        new NextRequest('http://localhost:3000/api/admin/auth/callback?code=code&state=expected', {
          headers: { cookie },
        }),
      )
      expect(result.headers.get('location')).toBe('http://localhost:3000/admin/login?error=expired')
    }
    expect(mocks.exchange).not.toHaveBeenCalled()
    expect(mocks.setCookie).not.toHaveBeenCalled()
  })
  it('returns failed or denied exchanges to the local login without setting a session', async () => {
    for (const [error, code] of [
      [new Error('expired code'), 'failed'],
      [new DmsError('Denied', 403, 'NO_WEBSITE_ACCESS'), 'access'],
    ] as const) {
      mocks.exchange.mockRejectedValueOnce(error)
      const result = await callback(
        new NextRequest('http://localhost:3000/api/admin/auth/callback?code=code&state=expected', {
          headers: { cookie: 'lightdms_state=expected' },
        }),
      )
      expect(result.headers.get('location')).toBe(`http://localhost:3000/admin/login?error=${code}`)
    }
    expect(mocks.setCookie).not.toHaveBeenCalled()
  })
  it('keeps production redirects on the configured website, even for localhost requests', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DMS_URL', 'https://dms.test')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://dealer.example.test')
    const result = await login(new NextRequest('http://localhost:3000/api/admin/auth/login'))
    expect(new URL(result.headers.get('location')!).searchParams.get('redirect_uri')).toBe(
      'https://dealer.example.test/api/admin/auth/callback',
    )
    expect(result.cookies.get('lightdms_state')?.secure).toBe(true)
  })
  it('does not accept an arbitrary request hostname as a redirect destination', () => {
    expect(siteOrigin('https://untrusted.example.test')).toBe('http://localhost:3101')
  })
})
