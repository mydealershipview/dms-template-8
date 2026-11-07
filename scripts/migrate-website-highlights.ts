/** Human-run, one-time migration. Dry run is default; never clears the source collection. */
import 'dotenv/config'
import { MongoClient } from 'mongodb'
const apply = process.argv.includes('--apply')
const session = process.env.MIGRATION_WEBSITE_SESSION
if (!process.env.DATABASE_URI || !process.env.DMS_URL || !process.env.DMS_WEBSITE_KEY || !session)
  throw new Error(
    'Set DATABASE_URI, DMS_URL, DMS_WEBSITE_KEY and MIGRATION_WEBSITE_SESSION privately',
  )
const mongo = new MongoClient(process.env.DATABASE_URI)
await mongo.connect()
let candidates = 0
try {
  const cursor = mongo
    .db()
    .collection('vehicle-overrides')
    .find({ websiteHighlight: { $type: 'string', $ne: '' } })
  for await (const row of cursor) {
    if (
      typeof row.stockId !== 'string' ||
      typeof row.websiteHighlight !== 'string' ||
      row.websiteHighlight.length > 60
    )
      throw new Error('Malformed legacy override; manual review required')
    const url = new URL(
      `/api/website-admin/stock/${encodeURIComponent(row.stockId)}`,
      process.env.DMS_URL,
    )
    const headers = {
      Authorization: `Bearer ${process.env.DMS_WEBSITE_KEY}`,
      'X-Website-Session': session,
      'Content-Type': 'application/json',
    }
    const current = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
    if (!current.ok)
      throw new Error('Could not verify a legacy stock row; no source data has been removed')
    const { vehicle } = await current.json()
    if (vehicle.websiteHighlight?.trim()) {
      if (vehicle.websiteHighlight.trim() !== row.websiteHighlight.trim())
        throw new Error(
          'Existing DMS highlight conflicts with website override. Resolve manually before retrying.',
        )
      continue
    }
    candidates++
    if (apply) {
      const result = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ websiteHighlight: row.websiteHighlight.trim() }),
        signal: AbortSignal.timeout(15000),
      })
      if (!result.ok)
        throw new Error('Migration write failed; source overrides are retained for safe retry')
    }
  }
  console.info(
    `${apply ? 'Migrated' : 'Would migrate'} ${candidates} highlights. Source collection retained as a backup.`,
  )
} finally {
  await mongo.close()
}
