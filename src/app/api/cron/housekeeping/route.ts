import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isCron } from '@/security/cron'
import { deliverSubmission } from '@/forms/delivery'
import { dmsJson } from '@/lightdms/dms'
export const dynamic = 'force-dynamic'
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
export async function GET(request: Request) {
  if (!isCron(request)) return json({ error: 'Unauthorized' }, 401)
  try {
    const payload = await getPayload({ config }),
      now = Date.now()
    const days = Number(process.env.SOLD_PENDING_RETENTION_DAYS || 7)
    if (!Number.isInteger(days) || days < 7)
      throw new Error('Pending retention must be at least seven days')
    const pending = await payload.find({
      collection: 'sold-archive',
      where: {
        and: [
          { confirmed: { not_equals: true } },
          {
            or: [
              { pendingSince: { less_than: new Date(now - days * 86400000).toISOString() } },
              {
                and: [
                  { pendingSince: { exists: false } },
                  { createdAt: { less_than: new Date(now - days * 86400000).toISOString() } },
                ],
              },
            ],
          },
          { cleanupNotifiedAt: { less_than: new Date(now - 86400000).toISOString() } },
        ],
      },
      limit: 50,
      overrideAccess: true,
    })
    let removed = 0,
      recoveryFailed = false
    if (pending.docs.length) {
      try {
        const result = await dmsJson<{ states: Record<string, string | null> }>(
          `/api/website/stock-states?stockIds=${encodeURIComponent(pending.docs.map((doc) => doc.stockId).join(','))}`,
        )
        if (!result.states || typeof result.states !== 'object' || Array.isArray(result.states))
          throw new Error('Invalid lifecycle response')
        for (const doc of pending.docs) {
          const state = result.states[doc.stockId]
          if (
            Object.hasOwn(result.states, doc.stockId) &&
            (state === null || (typeof state === 'string' && state !== 'SOLD'))
          ) {
            // The original generation must still be pending. A concurrent sale/confirmation wins.
            const deleted = await payload.db.collections['sold-archive'].deleteOne({
              _id: doc.id,
              confirmed: { $ne: true },
              updatedAt: new Date(doc.updatedAt),
            })
            removed += deleted.deletedCount
          }
        }
      } catch {
        recoveryFailed = true
        console.error('Sold reconciliation unavailable; pending archives retained')
      }
    }
    const outbox = await payload.find({
      collection: 'form-outbox',
      where: {
        and: [
          {
            or: [
              { emailDelivered: { not_equals: true } },
              { webhookDelivered: { not_equals: true } },
            ],
          },
          {
            or: [
              { nextAttemptAt: { less_than_equal: new Date(now).toISOString() } },
              { nextAttemptAt: { exists: false } },
            ],
          },
        ],
      },
      limit: 25,
      sort: 'nextAttemptAt',
      overrideAccess: true,
    })
    for (const entry of outbox.docs) {
      try {
        await deliverSubmission(entry)
      } catch {
        recoveryFailed = true
        console.error('Outbox retry pending')
      }
    }
    const delivered = await payload.find({
      collection: 'form-outbox',
      where: {
        and: [
          { emailDelivered: { equals: true } },
          { webhookDelivered: { equals: true } },
          { deliveredAt: { less_than: new Date(now - 30 * 86400000).toISOString() } },
        ],
      },
      limit: 50,
      overrideAccess: true,
    })
    for (const entry of delivered.docs)
      await payload.delete({ collection: 'form-outbox', id: entry.id, overrideAccess: true })
    return json(
      { success: !recoveryFailed, removed, retried: outbox.docs.length },
      recoveryFailed ? 503 : 200,
    )
  } catch {
    console.error('Housekeeping failed; records retained')
    return json({ error: 'Housekeeping needs attention' }, 503)
  }
}
