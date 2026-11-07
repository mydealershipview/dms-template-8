import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { siteOrigin } from '@/lightdms/config'
import { dmsJson, DmsError } from '@/lightdms/dms'
import { setSessionToken, STATE_COOKIE, stateCookieOptions } from '@/lightdms/session'

const sameState = (a: string, b: string) => {
  const given = Buffer.from(a)
  const expected = Buffer.from(b)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** The DMS sends the user back here with ?code=&state= after they signed in. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const state = request.nextUrl.searchParams.get('state') ?? ''
  const expected = request.cookies.get(STATE_COOKIE)?.value ?? ''
  const back = (error?: string) => {
    const target = new URL(
      '/admin/login',
      siteOrigin(request.nextUrl.origin, request.headers.get('host')),
    )
    if (error) target.searchParams.set('error', error)
    const response = NextResponse.redirect(
      error
        ? target
        : new URL('/admin', siteOrigin(request.nextUrl.origin, request.headers.get('host'))),
    )
    response.cookies.set(STATE_COOKIE, '', { ...stateCookieOptions(), maxAge: 0 })
    return response
  }
  if (!code || !state || !expected || !sameState(state, expected)) return back('expired')
  try {
    const session = await dmsJson<{ sessionToken: string; expiresAt: string }>(
      '/api/website-admin/session',
      {
        method: 'POST',
        json: { code },
      },
    )
    await setSessionToken(session.sessionToken, session.expiresAt)
    return back()
  } catch (error) {
    if (error instanceof DmsError && error.code === 'NO_WEBSITE_ACCESS') return back('access')
    console.error('Website admin sign-in failed')
    return back('failed')
  }
}
