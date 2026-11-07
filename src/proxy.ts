import { NextRequest, NextResponse } from 'next/server'
import { siteNoindex } from '@/lib/noindex'
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (/\/(create-first-user|first-register)(\/|$)/i.test(path))
    return NextResponse.json(
      { error: 'Private provisioning required' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  const canonical = process.env.SITE_CANONICAL_HOST
  const aliases = (process.env.SITE_REDIRECT_HOSTS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  if (canonical && aliases.includes(request.nextUrl.host)) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonical}`)
    return NextResponse.redirect(url, 308)
  }
  const response = NextResponse.next()
  if(siteNoindex()) response.headers.set('X-Robots-Tag','noindex, nofollow')
  if (path.startsWith('/admin') || path.startsWith('/api/') || path.startsWith('/websiteadmin')) {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
