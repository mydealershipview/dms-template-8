import { cookies } from 'next/headers'

/**
 * The website-admin session: the DMS's session token, kept in an httpOnly cookie on this site
 * and sent to the DMS server-to-server. The browser never reads it.
 */
export const SESSION_COOKIE = 'lightdms_api_session'
export const PAGE_SESSION_COOKIE = 'lightdms_page_session'
export const STATE_COOKIE = 'lightdms_state'

const secure = () => process.env.NODE_ENV === 'production'

export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(SESSION_COOKIE)?.value ?? jar.get(PAGE_SESSION_COOKIE)?.value ?? null
}

export async function setSessionToken(token: string, expiresAt: string) {
  const expires = new Date(expiresAt)
  if (!token || !Number.isFinite(expires.getTime()) || expires.getTime() <= Date.now())
    throw new Error('Invalid DMS session response')
  const jar = await cookies()
  jar.set('lightdms_session', '', { path: '/', maxAge: 0 })
  for (const [name, path] of [
    [SESSION_COOKIE, '/api/admin'],
    [PAGE_SESSION_COOKIE, '/admin'],
  ]) {
    jar.set(name, token, {
      httpOnly: true,
      secure: secure(),
      sameSite: 'lax',
      path,
      expires: Number.isNaN(expires.getTime()) ? undefined : expires,
    })
  }
}

export async function clearSession() {
  const jar = await cookies()
  for (const [name, path] of [
    ['lightdms_session', '/'],
    [SESSION_COOKIE, '/api/admin'],
    [PAGE_SESSION_COOKIE, '/admin'],
  ])
    jar.set(name, '', { httpOnly: true, secure: secure(), sameSite: 'lax', path, maxAge: 0 })
}

export const stateCookieOptions = () => ({
  httpOnly: true,
  secure: secure(),
  sameSite: 'lax' as const,
  path: '/api/admin/auth',
  maxAge: 600,
})
