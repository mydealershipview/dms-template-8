import { afterEach, describe, expect, it, vi } from 'vitest'
import { deliverDmsLead } from '@/utilities/dmsLead'
const id = '12345678-1234-4123-8123-123456789012'
function configure() {
  for (const [k, v] of Object.entries({
    DEALER_ID: '11111111-1111-4111-8111-111111111111',
    EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET: 'fixture',
    FORM_SUBMIT_WEBHOOK_URL: 'https://dms.test/api/webhooks/external-notifications',
    LEAD_SOURCE_WEBSITE: 'dealer.test',
  }))
    vi.stubEnv(k, v)
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
describe('persisted lead acknowledgement', () => {
  it.each([200, 201])('requires persisted ID on %i and overwrites routing', async (status) => {
    configure()
    const fetcher = vi.fn(async (_url: unknown, _init: RequestInit) =>
      Response.json({ success: true, notificationId: 42, duplicate: status === 200 }, { status }),
    )
    vi.stubGlobal('fetch', fetcher)
    expect(
      (
        await deliverDmsLead(
          {
            affiliateId: 'attacker',
            advertiserId: 'attacker',
            sourceWebsite: 'attacker',
            personal: { firstName: 'Fixture' },
          },
          id,
        )
      ).notificationId,
    ).toBe('42')
    const init = fetcher.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(init.body))
    expect(body.affiliateId).toBe(process.env.DEALER_ID)
    expect(body.advertiserId).toBe(process.env.DEALER_ID)
    expect(body.sourceWebsite).toBe('dealer.test')
    expect(body.submissionId).toBe(id)
    expect((init.headers as Record<string, string>)['x-webhook-secret']).toBe('fixture')
  })
  it.each([
    {},
    { success: true },
    { success: false, notificationId: 42 },
    { success: true, notificationId: '' },
  ])('rejects unacknowledged 200 %j', async (body) => {
    configure()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body)),
    )
    await expect(deliverDmsLead({}, id)).rejects.toThrow()
  })
  it.each([400, 401, 429, 500])('rejects %i without email-only success', async (status) => {
    configure()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: false }, { status })),
    )
    await expect(deliverDmsLead({}, id)).rejects.toThrow()
  })
  it('refuses invalid routing, identity and endpoint before network', async () => {
    configure()
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    vi.stubEnv('DEALER_ID', 'advertiser-number')
    await expect(deliverDmsLead({}, id)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
