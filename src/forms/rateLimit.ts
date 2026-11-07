import { createHmac } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
/** Atomic shared counters survive restarts and work across Vercel instances. No raw IP is stored. */
export async function consumeFormLimit(request: Request): Promise<boolean> {
  const payload = await getPayload({ config })
  const ip =
    process.env.VERCEL === '1'
      ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : process.env.FORMS_TRUST_PROXY === 'true'
        ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        : 'single-host'
  const window = Math.floor(Date.now() / 900000)
  const key = createHmac('sha256', process.env.PAYLOAD_SECRET!)
    .update(`${new URL(request.url).pathname}:${ip}:${window}`)
    .digest('hex')
  const model = payload.db.collections['form-rate-limits']
  await model.init() // The unique bucket index must exist before concurrent upserts.
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { key, expiresAt: new Date((window + 2) * 900000) },
  }
  let row: { count: number } | null
  try {
    row = (await model.collection.findOneAndUpdate({ key }, update, {
      upsert: true,
      returnDocument: 'after',
    })) as { count: number } | null
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error
    row = (await model.collection.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { returnDocument: 'after' },
    )) as { count: number } | null
  }
  if (!row) throw new Error('Form rate counter unavailable')
  return row.count <= 10
}
