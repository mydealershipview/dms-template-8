'use client'
export type Touch = Partial<
  Record<
    | 'gclid'
    | 'gbraid'
    | 'wbraid'
    | 'fbclid'
    | 'utmSource'
    | 'utmMedium'
    | 'utmCampaign'
    | 'utmContent'
    | 'referrer'
    | 'landingPage'
    | 'capturedAt',
    string
  >
>
const LAST = 'mydv_ad_attribution',
  FIRST = 'mydv_ad_attribution_first'
export function attributionAllowed() {
  try {
    return localStorage.getItem('cookies-accepted') === 'true'
  } catch {
    return false
  }
}
function read(name: string): Touch | undefined {
  try {
    const value = document.cookie
      .split('; ')
      .find((v) => v.startsWith(`${name}=`))
      ?.slice(name.length + 1)
    return value ? JSON.parse(decodeURIComponent(value)) : undefined
  } catch {
    return undefined
  }
}
export function clearAttribution() {
  for (const name of [LAST, FIRST]) document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}
export function captureAttribution() {
  if (!attributionAllowed()) {
    clearAttribution()
    return
  }
  const url = new URL(window.location.href)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return
  const touch: Touch = {}
  for (const [query, key] of Object.entries({
    gclid: 'gclid',
    gbraid: 'gbraid',
    wbraid: 'wbraid',
    fbclid: 'fbclid',
    utm_source: 'utmSource',
    utm_medium: 'utmMedium',
    utm_campaign: 'utmCampaign',
    utm_content: 'utmContent',
  })) {
    const value = url.searchParams.get(query)
    if (value) touch[key as keyof Touch] = value.slice(0, 300)
  }
  let referral = ''
  try {
    const ref = new URL(document.referrer)
    if (ref.origin !== url.origin) referral = ref.origin
  } catch {
    /* no referrer */
  }
  if (!Object.keys(touch).length && !referral) return // Direct/internal visits do not erase campaign history.
  if (referral) touch.referrer = referral
  touch.landingPage = `${url.origin}${url.pathname}`.slice(0, 300)
  touch.capturedAt = new Date().toISOString()
  for (const name of [LAST, ...(!read(FIRST) ? [FIRST] : [])])
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(touch))}; Path=/; Max-Age=2592000; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`
}
export function getAttribution() {
  return attributionAllowed() ? { attribution: read(LAST), firstTouchAttribution: read(FIRST) } : {}
}
