import { NextRequest, NextResponse } from 'next/server'
import { siteOrigin } from './config'
import { clearSession, getSessionToken } from './session'
import { DmsError } from './dms'

/**
 * Guards for this site's /api/admin routes (called by the website admin in the browser).
 * - The website-admin session cookie is httpOnly and SameSite=Lax.
 * - Changes must come from this site: same Origin and the X-LightDMS header, which a cross-site
 *   form cannot send.
 */
export const ADMIN_HEADER = 'x-lightdms'

export function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}

export function sameSiteChange(request: NextRequest): boolean {
  if (request.headers.get(ADMIN_HEADER) !== '1') return false
  const origin = request.headers.get('origin')
  return !origin || origin === siteOrigin(request.nextUrl.origin, request.headers.get('host'))
}

type Handler<A extends unknown[]> = (
  request: NextRequest,
  session: string,
  ...args: A
) => Promise<NextResponse>

/** A signed-in website-admin request; DMS errors become JSON with the DMS's message. */
export function adminRoute<A extends unknown[]>(
  handler: Handler<A>,
  options: { change?: boolean } = {},
) {
  return async (request: NextRequest, ...args: A): Promise<NextResponse> => {
    if (options.change !== false && request.method !== 'GET' && !sameSiteChange(request))
      return noStoreJson({ success: false, error: 'Request refused' }, 403)
    const session = await getSessionToken()
    if (!session)
      return noStoreJson({ success: false, error: 'Please sign in', code: 'SESSION_INVALID' }, 401)
    try {
      return await handler(request, session, ...args)
    } catch (error) {
      if (error instanceof DmsError) {
        if (error.status === 401) await clearSession()
        return noStoreJson({ success: false, error: error.message, code: error.code }, error.status)
      }
      console.error('Website admin request failed')
      return noStoreJson({ success: false, error: 'Something went wrong. Please try again.' }, 500)
    }
  }
}
