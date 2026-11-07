import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import { boundedBody, imageType } from '@/security/body'
import { provisionAdmin } from '@/security/provisionAdmin'
import { Users } from '@/collections/Users'
import { Listings } from '@/collections/Listings'
import { validateProductionEnv } from '../../scripts/validate-env.mjs'
import { isAdmin } from '@/access/isAdmin'
describe('CMS and bounded bodies', () => {
  it('validates the supplied production environment without reading host credentials', () => {
    const env = { NODE_ENV: 'production', DATABASE_URI: 'mongodb://127.0.0.1/test', PAYLOAD_SECRET: 'x'.repeat(32), DMS_URL: 'https://dms.test', DMS_WEBSITE_KEY: 'fixture', DEALER_ID: '11111111-1111-4111-8111-111111111111', FORM_SUBMIT_WEBHOOK_URL: 'https://dms.test/api/webhooks/external-notifications', EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET: 'fixture-secret', LEAD_SOURCE_WEBSITE: 'dealer.test', NEXT_PUBLIC_SERVER_URL: 'https://dealer.test', CRON_SECRET: 'x'.repeat(32), S3_BUCKET: 'fixture', TURNSTILE_SECRET_KEY: 'fixture', NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'fixture' }
    expect(() => validateProductionEnv(env)).not.toThrow()
    expect(() => validateProductionEnv({...env,DMS_WEBSITE_KEY:''})).toThrow('DMS_WEBSITE_KEY')
    expect(() => validateProductionEnv({...env,DMS_URL:'http://dms.test'})).toThrow('HTTPS')
    expect(() => validateProductionEnv({...env,CRON_SECRET:'short'})).toThrow('32')
  })
  it('demo bypass works only when the site is also non-indexable', async () => {
    const { turnstileDemoBypass } = await import('@/forms/security')
    expect(turnstileDemoBypass({ TURNSTILE_DEMO_BYPASS: 'true', SEO_NOINDEX: 'true' })).toBe(true)
    expect(turnstileDemoBypass({ TURNSTILE_DEMO_BYPASS: 'true', SITE_NOINDEX: 'true' })).toBe(true)
    expect(turnstileDemoBypass({ TURNSTILE_DEMO_BYPASS: 'true' })).toBe(false)
    expect(turnstileDemoBypass({ TURNSTILE_DEMO_BYPASS: 'true', SEO_NOINDEX: 'false' })).toBe(false)
    expect(turnstileDemoBypass({ SEO_NOINDEX: 'true' })).toBe(false)
  })
  it('production validation rejects the bypass on an indexable site and otherwise needs Turnstile keys', () => {
    const env = { NODE_ENV: 'production', DATABASE_URI: 'mongodb://127.0.0.1/test', PAYLOAD_SECRET: 'x'.repeat(40), DMS_URL: 'https://dms.test', DMS_WEBSITE_KEY: 'fixture', DEALER_ID: '11111111-1111-4111-8111-111111111111', FORM_SUBMIT_WEBHOOK_URL: 'https://dms.test/api/webhooks/external-notifications', EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET: 'fixture-secret', LEAD_SOURCE_WEBSITE: 'dealer.test', NEXT_PUBLIC_SERVER_URL: 'https://dealer.test', CRON_SECRET: 'x'.repeat(40), S3_BUCKET: 'b' }
    expect(() => validateProductionEnv(env)).toThrow(/TURNSTILE_SECRET_KEY/)
    expect(() => validateProductionEnv({ ...env, TURNSTILE_DEMO_BYPASS: 'true' })).toThrow(/SEO_NOINDEX/)
    expect(() => validateProductionEnv({ ...env, TURNSTILE_DEMO_BYPASS: 'true', SEO_NOINDEX: 'true' })).not.toThrow()
  })
  it('blocks public first-user routes before Payload can initialize', () => {
    for (const path of [
      '/api/users/first-register',
      '/api/users/create-first-user',
      '/websiteadmin/create-first-user',
    ])
      expect(proxy(new NextRequest(`https://dealer.test${path}`)).status).toBe(403)
  })
  it('keeps listings private, removes default admin privilege', () => {
    expect(Listings.access?.read).toBe(isAdmin)
    expect(Listings.access?.update).toBe(isAdmin)
    const roles = Users.fields.find((f) => 'name' in f && f.name === 'roles') as {
      defaultValue: string[]
    }
    expect(roles.defaultValue).toEqual(['user'])
  })
  it('provisions idempotently and refuses changing an existing nonadmin or resetting passwords', async () => {
    const client = {
      find: vi.fn().mockResolvedValue({ docs: [{ roles: ['admin'] }] }),
      count: vi.fn(),
      create: vi.fn(),
    }
    expect(
      await provisionAdmin(client as never, 'admin@example.test', 'fixture-password-123'),
    ).toEqual({ created: false })
    expect(client.create).not.toHaveBeenCalled()
    client.find.mockResolvedValue({ docs: [{ roles: ['user'] }] })
    await expect(
      provisionAdmin(client as never, 'admin@example.test', 'fixture-password-123'),
    ).rejects.toThrow()
  })
  it('bounds chunked bodies without trusting Content-Length, validates image signatures', async () => {
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(20))
        c.close()
      },
    })
    await expect(
      boundedBody(
        new Request('https://dealer.test', {
          method: 'POST',
          body: stream,
          duplex: 'half',
        } as RequestInit),
        10,
      ),
    ).rejects.toThrow()
    expect(imageType(new TextEncoder().encode('<script>'))).toBeNull()
    expect(imageType(Uint8Array.from([255, 216, 255]))).toBe('image/jpeg')
  })
})
