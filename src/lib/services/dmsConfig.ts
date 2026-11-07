import 'server-only'
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}
export function safeUrl(raw: string): URL {
  const url = new URL(raw)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
  )
    throw new Error('Invalid server URL configuration')
  return url
}
export function stockConfig() {
  const configured = safeUrl(required('DMS_URL'))
  if (!['', '/api/website/stock'].includes(configured.pathname.replace(/\/+$/, '')))
    throw new Error('Invalid DMS origin or stock path')
  const url = new URL('/api/website/stock', configured.origin)
  const key = required('DMS_WEBSITE_KEY')
  const advertiser = process.env.DMS_ADVERTISER_ID?.trim()
  if (advertiser) url.searchParams.set('advertiserId', advertiser)
  return { url, key }
}
export function leadConfig(reservation = false) {
  const dealerId = required('DEALER_ID')
  if (!uuid.test(dealerId)) throw new Error('DEALER_ID must be the DMS dealer UUID')
  const secret = required('EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET')
  const url = safeUrl(
    reservation && process.env.VEHICLE_RESERVATION_WEBHOOK_URL?.trim()
      ? process.env.VEHICLE_RESERVATION_WEBHOOK_URL.trim()
      : required('FORM_SUBMIT_WEBHOOK_URL'),
  )
  if (url.pathname !== '/api/webhooks/external-notifications' || url.search || url.hash)
    throw new Error('Expected the DMS external-notifications webhook endpoint')
  const source = required('LEAD_SOURCE_WEBSITE')
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(source)) throw new Error('Expected a source hostname')
  return { dealerId, secret, url, source }
}
