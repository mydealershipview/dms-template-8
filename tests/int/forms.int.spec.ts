import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
const email = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: email }
  },
}))
import { formRoute } from '@/forms/route'
import { consumeFormLimit } from '@/forms/rateLimit'
import { deliverSubmission } from '@/forms/delivery'
let payload: Payload
const base = { privacyAccepted: true,
  enquiryType: 'find-your-next-car',
  personal: { firstName: 'Fixture', email: 'fixture@example.test', phoneNumber: '07700900123' },
  notes: 'Fixture enquiry',
  website: '',
  turnstileToken: 'test-token',
}
const request = (body: unknown, origin = 'https://dealer.test') =>
  new Request('https://dealer.test/api/submit-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.destroy()
})
beforeEach(async () => {
  await payload.delete({ collection: 'form-outbox', where: {}, overrideAccess: true })
  await payload.db.collections['form-rate-limits'].deleteMany({})
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SERVER_URL: 'https://dealer.test',
    TURNSTILE_SECRET_KEY: 'fixture-secret',
    DEALER_ID: '11111111-1111-4111-8111-111111111111',
    EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET: 'fixture',
    FORM_SUBMIT_WEBHOOK_URL: 'https://dms.test/api/webhooks/external-notifications',
    LEAD_SOURCE_WEBSITE: 'dealer.test',
    RESEND_API_KEY: 'fixture',
    EMAIL_FROM: 'forms@example.test',
    EMAIL_TO: 'dealer@example.test',
  }))
    vi.stubEnv(key, value)
  email.mockReset().mockResolvedValue({ data: { id: 'email' } })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string) =>
      String(input).includes('turnstile')
        ? Response.json({ success: true, hostname: 'dealer.test', action: 'dealer-form' })
        : Response.json({ success: true, notificationId: 'lead-1' }, { status: 201 }),
    ),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
describe('durable enquiry delivery on disposable Mongo', () => {
  it('saves before delivery and deduplicates identical request replay', async () => {
    const submissionId = randomUUID(),
      body = { ...base, submissionId, affiliateId: 'forged' }
    expect((await formRoute('enquiry')(request(body))).status).toBe(200)
    expect((await formRoute('enquiry')(request(body))).status).toBe(200)
    expect(
      (await payload.count({ collection: 'form-outbox', overrideAccess: true })).totalDocs,
    ).toBe(1)
    expect(email).toHaveBeenCalledTimes(1)
    const entries = await payload.find({ collection: 'form-outbox', overrideAccess: true })
    expect(entries.docs[0].notificationId).toBe('lead-1')
    expect(entries.docs[0].webhookDelivered).toBe(true)
    expect(JSON.stringify(entries.docs[0].submission)).not.toContain('forged')
  })
  it('does not call email success DMS success; retries same body identity after uncertain save', async () => {
    const submissionId = randomUUID()
    let attempts = 0
    const sent: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string, init: RequestInit) => {
        if (String(input).includes('turnstile'))
          return Response.json({ success: true, hostname: 'dealer.test', action: 'dealer-form' })
        sent.push(JSON.parse(String(init.body)).submissionId)
        if (attempts++ === 0) throw new Error('response lost after receiver saved')
        return Response.json({ success: true, notificationId: 'same-lead', duplicate: true })
      }),
    )
    const first = await formRoute('enquiry')(request({ ...base, submissionId }))
    expect(first.status).toBe(202)
    expect((await first.json()).success).toBe(false)
    const retry = await formRoute('enquiry')(request({ ...base, submissionId }))
    expect(retry.status).toBe(200)
    expect(sent).toEqual([submissionId, submissionId])
    expect(email).toHaveBeenCalledTimes(1)
  })
  it('retries failed email without re-sending an acknowledged DMS lead', async () => {
    email.mockRejectedValueOnce(new Error('offline'))
    const body = { ...base, submissionId: randomUUID() }
    const first = await formRoute('enquiry')(request(body))
    expect(first.status).toBe(200)
    expect((await first.json()).warning).toMatch(/pending/)
    const entries = await payload.find({ collection: 'form-outbox', overrideAccess: true })
    const fetcher = vi.mocked(fetch)
    fetcher.mockClear()
    await deliverSubmission(entries.docs[0])
    expect(fetcher).not.toHaveBeenCalled()
    expect(email).toHaveBeenCalledTimes(2)
  })
  it('rejects mismatched payload replay and untrusted origins', async () => {
    const body = { ...base, submissionId: randomUUID() }
    await formRoute('enquiry')(request(body))
    expect((await formRoute('enquiry')(request({ ...body, notes: 'changed' }))).status).toBe(409)
    expect(
      (
        await formRoute('enquiry')(
          request({ ...body, submissionId: randomUUID() }, 'https://attacker.test'),
        )
      ).status,
    ).toBe(403)
  })
  it('rejects honeypot, malformed/oversize JSON, wrong verification action and unknown nested fields', async () => {
    expect(
      (await formRoute('enquiry')(request({ ...base, submissionId: randomUUID(), website: 'bot' })))
        .status,
    ).toBe(400)
    expect(
      (
        await formRoute('enquiry')(
          request({
            ...base,
            submissionId: randomUUID(),
            personal: { ...base.personal, admin: true },
          }),
        )
      ).status,
    ).toBe(400)
    expect(
      (
        await formRoute('enquiry')(
          request({ ...base, submissionId: randomUUID(), notes: 'a'.repeat(40000) }),
        )
      ).status,
    ).toBe(400)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: true, hostname: 'dealer.test', action: 'wrong' })),
    )
    expect(
      (await formRoute('enquiry')(request({ ...base, submissionId: randomUUID() }))).status,
    ).toBe(400)
    expect(
      (await payload.count({ collection: 'form-outbox', overrideAccess: true })).totalDocs,
    ).toBe(0)
  })
  it('demo bypass skips Turnstile only with SEO_NOINDEX, keeping honeypot and outbox', async () => {
    const noToken = { ...base, turnstileToken: undefined }
    vi.stubEnv('SITE_NOINDEX', 'false')
    vi.stubEnv('SEO_NOINDEX', 'false')
    vi.stubEnv('TURNSTILE_DEMO_BYPASS', 'true')
    expect((await formRoute('enquiry')(request({ ...noToken, submissionId: randomUUID() }))).status).toBe(400)
    vi.stubEnv('SEO_NOINDEX', 'true')
    expect((await formRoute('enquiry')(request({ ...noToken, submissionId: randomUUID(), website: 'bot' }))).status).toBe(400)
    expect((await formRoute('enquiry')(request({ ...noToken, submissionId: randomUUID() }))).status).toBeLessThan(300)
  })
  it('limits concurrent requests atomically across the shared database', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeFormLimit(request({}))),
    )
    expect(results.filter(Boolean)).toHaveLength(10)
  })
  it('claims one outbox worker atomically', async () => {
    const entry = await payload.create({
      collection: 'form-outbox',
      overrideAccess: true,
      data: {
        submissionId: randomUUID(),
        payloadHash: 'fixture',
        kind: 'enquiry',
        submission: base,
      },
    })
    await Promise.all([
      deliverSubmission(entry),
      deliverSubmission(entry),
      deliverSubmission(entry),
    ])
    expect(email).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(fetch).mock.calls.filter(([url]) => !String(url).includes('turnstile')),
    ).toHaveLength(1)
  })
})
