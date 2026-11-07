import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getInventory, inventoryHealth } from '@/utilities/vehicleInventory'
import { captureMessage } from '@sentry/nextjs'
export const dynamic = 'force-dynamic'
let lastAlertAt = 0
export async function GET() {
  await getInventory().catch(() => undefined)
  let databaseReachable = false,
    pendingSoldSnapshots = false
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'users', overrideAccess: true })
    pendingSoldSnapshots =
      (
        await payload.count({
          collection: 'sold-archive',
          where: { confirmed: { not_equals: true } },
          overrideAccess: true,
        })
      ).totalDocs > 0
    databaseReachable = true
  } catch {
    console.error('Website database unavailable')
  }
  const inventory = inventoryHealth()
  if (
    (inventory.staleLimitExceeded || !databaseReachable || pendingSoldSnapshots) &&
    Date.now() - lastAlertAt > 900000
  ) {
    captureMessage('dealer_site_attention_required', { level: 'error' })
    lastAlertAt = Date.now()
  }
  return NextResponse.json(
    { ...inventory, databaseReachable, pendingSoldSnapshots, templateVersion: 'template-8/2.0.0' },
    {
      status: inventory.feedReachable && !inventory.servingStale && databaseReachable ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
