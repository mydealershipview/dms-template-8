import 'server-only'
import { leadConfig, uuid } from '@/lib/services/dmsConfig'
export async function deliverDmsLead(validated: Record<string, unknown>, submissionId: string) {
  if (!uuid.test(submissionId)) throw new Error('Invalid submission identity')
  const config = leadConfig()
  const response = await fetch(config.url, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': config.secret,
      'Idempotency-Key': submissionId,
    },
    body: JSON.stringify({
      ...validated,
      submissionId,
      affiliateId: config.dealerId,
      advertiserId: config.dealerId,
      sourceWebsite: config.source,
    }),
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json().catch(() => null)
  if (
    ![200, 201].includes(response.status) ||
    result?.success !== true ||
    !(
      (typeof result.notificationId === 'string' && result.notificationId.trim()) ||
      (typeof result.notificationId === 'number' && Number.isFinite(result.notificationId))
    )
  )
    throw new Error('DMS lead was not acknowledged')
  return { notificationId: String(result.notificationId), duplicate: result.duplicate === true }
}
