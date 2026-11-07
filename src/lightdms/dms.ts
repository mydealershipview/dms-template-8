import 'server-only'
import { lightDmsConfig } from './config'

/**
 * Calls to the DMS. Every call carries the website key; website-admin calls also carry the
 * signed-in user's session. Never logs the DMS URL or the key (spec 9.4).
 */

export class DmsError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}

type Init = {
  method?: string
  session?: string
  json?: unknown
  body?: BodyInit
  contentType?: string
  timeoutMs?: number
}

export async function dmsFetch(path: string, init: Init = {}): Promise<Response> {
  const { url, key } = lightDmsConfig()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  }
  if (init.session) headers['X-Website-Session'] = init.session
  let body = init.body
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(init.json)
  } else if (init.contentType) {
    headers['Content-Type'] = init.contentType
  }
  return fetch(`${url}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body,
    ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(init.timeoutMs ?? 60_000),
  })
}

/** JSON from a DMS call, or a DmsError with the DMS's own message. */
export async function dmsJson<T = Record<string, unknown>>(
  path: string,
  init: Init = {},
): Promise<T> {
  const response = await dmsFetch(path, init)
  const body = (await response.json().catch(() => null)) as
    | (T & { success?: boolean; error?: unknown; code?: string })
    | null
  if (!response.ok || !body || body.success !== true) {
    const message =
      typeof body?.error === 'string'
        ? body.error
        : `The DMS could not complete this (${response.status})`
    throw new DmsError(message, response.ok ? 502 : response.status, body?.code)
  }
  return body
}
