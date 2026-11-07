import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { lightDmsConfig, siteOrigin } from '@/lightdms/config'
import { STATE_COOKIE, stateCookieOptions } from '@/lightdms/session'

/**
 * Sign in to the website admin: the user signs in with their MYDEALERSHIPVIEW (DMS) account on
 * the DMS, which sends them back to /api/admin/auth/callback with a one-time code.
 */
export async function GET(request: NextRequest) {
  const { url } = lightDmsConfig()
  const state = randomBytes(24).toString('base64url')
  const connect = new URL('/website-admin/connect', url)
  connect.searchParams.set(
    'redirect_uri',
    `${siteOrigin(request.nextUrl.origin, request.headers.get('host'))}/api/admin/auth/callback`,
  )
  connect.searchParams.set('state', state)
  const response = NextResponse.redirect(connect)
  response.cookies.set(STATE_COOKIE, state, stateCookieOptions())
  return response
}
