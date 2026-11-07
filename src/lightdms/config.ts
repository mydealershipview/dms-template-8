/**
 * Light DMS connection settings. Server-side only: the website key and the advertiser ID never
 * reach a browser, an API response or page source (Light DMS spec 8.5).
 *
 * - DMS_URL: the MYDEALERSHIPVIEW DMS, e.g. https://app.mydealershipview.com
 * - DMS_WEBSITE_KEY: this website's key, issued by MYDEALERSHIPVIEW (rotated or revoked there)
 * - DMS_ADVERTISER_ID: optional, which of the dealer's Auto Trader advertiser IDs this site shows
 *   (default: the dealer's main one)
 */
export function lightDmsConfig() {
  const rawUrl = process.env.DMS_URL?.trim()
  const key = process.env.DMS_WEBSITE_KEY?.trim()
  if (!rawUrl || !key) throw new Error('Light DMS is not configured (DMS_URL and DMS_WEBSITE_KEY)')
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('DMS_URL must be the DMS origin, for example http://localhost:3001')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') ||
    !['', '/api/website/stock'].includes(parsed.pathname.replace(/\/+$/, ''))
  )
    throw new Error('DMS_URL must be the DMS origin, without credentials or an API path')
  // Accept the old stock-feed URL too; every DMS call supplies its own absolute API path.
  // Never retain query strings: dealer identity comes from the website key.
  return {
    url: parsed.origin,
    key,
    advertiserId: process.env.DMS_ADVERTISER_ID?.trim() || undefined,
  }
}

export const isLightDmsConfigured = () => !!process.env.DMS_URL && !!process.env.DMS_WEBSITE_KEY

/** This website's own origin (sign-in return address). */
export function siteOrigin(requestOrigin?: string, requestHost?: string | null): string {
  // Local ports often change between demo runs. Keep the callback on the same local website
  // that set the state cookie. Production always uses the configured public website origin.
  if (process.env.NODE_ENV !== 'production' && requestOrigin) {
    const request = new URL(requestOrigin)
    // Next normalizes 127.0.0.1 to localhost in nextUrl. Preserve an explicitly local Host so
    // the callback can still read the cookie set on the original host.
    if (requestHost && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestHost)) {
      request.host = requestHost
    }
    if (
      ['http:', 'https:'].includes(request.protocol) &&
      ['localhost', '127.0.0.1'].includes(request.hostname) &&
      !request.username &&
      !request.password
    )
      return request.origin
  }
  const configured = process.env.NEXT_PUBLIC_SERVER_URL
  if (!configured && process.env.NODE_ENV === 'production')
    throw new Error('Canonical website origin is required')
  const origin = new URL(configured || 'http://localhost:3000')
  if (
    origin.username ||
    origin.password ||
    (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:')
  )
    throw new Error('Invalid canonical origin')
  return origin.origin
}
