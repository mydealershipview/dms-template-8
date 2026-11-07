import { timingSafeEqual } from 'node:crypto'
export function isCron(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 32) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(request.headers.get('authorization') || '')
  return expected.length === given.length && timingSafeEqual(expected, given)
}
