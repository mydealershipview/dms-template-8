import { invalidateInventory } from '@/utilities/vehicleInventory'
import { boundedBody, imageType } from '@/security/body'
import { NextRequest } from 'next/server'
import { adminRoute, noStoreJson } from '@/lightdms/adminRequest'
import { dmsFetch } from '@/lightdms/dms'
import { clearSession } from '@/lightdms/session'

/**
 * The website admin's calls to the DMS website-admin routes, from this site's server with the
 * website key and the user's session. Only these routes; status changes go through
 * /api/admin/vehicles/[stockId]/status (they also update this site's showroom and Sold page).
 */
const ID = '[A-Za-z0-9_-]{1,80}'
const ALLOWED: Array<[method: string, pattern: RegExp]> = [
  ['GET', /^me$/],
  ['GET', /^stock$/],
  ['POST', /^stock$/],
  ['GET', /^stock\/add-status$/],
  ['GET', new RegExp(`^stock/${ID}$`)],
  ['PATCH', new RegExp(`^stock/${ID}/(price|channels|feeds)$`)],
  ['PUT', new RegExp(`^stock/${ID}/images$`)],
  ['POST', /^images$/],
  ['GET', /^vehicle-lookup$/],
  ['GET', /^vehicle-check$/],
]

export const maxDuration = 300

type Params = { params: Promise<{ path: string[] }> }

async function forward(request: NextRequest, session: string, { params }: Params) {
  const path = (await params).path.join('/')
  if (!ALLOWED.some(([method, pattern]) => method === request.method && pattern.test(path)))
    return noStoreJson({ success: false, error: 'Not found' }, 404)
  const allowedQueries =
    path === 'stock'
      ? ['status', 'search', 'page', 'pageSize']
      : path === 'stock/add-status'
        ? ['requestId']
        : path === 'vehicle-lookup'
          ? ['registration', 'mileage']
          : path === 'vehicle-check'
            ? ['registration']
            : []
  if ([...request.nextUrl.searchParams.keys()].some((key) => !allowedQueries.includes(key)))
    return noStoreJson({ success: false, error: 'Unsupported query parameter' }, 400)
  const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data')
  let upload: Uint8Array | undefined
  if (multipart) {
    if (path !== 'images' || request.method !== 'POST')
      return noStoreJson({ success: false, error: 'Unsupported upload' }, 415)
    try {
      upload = await boundedBody(request, 10 * 1024 * 1024 + 65536)
    } catch {
      return noStoreJson({ success: false, error: 'Images must be at most 10 MB' }, 413)
    }
    const form = await new Response(upload as BodyInit, {
      headers: { 'Content-Type': request.headers.get('content-type')! },
    })
      .formData()
      .catch(() => null)
    const files = form
      ? [...form.values()].filter((value): value is File => typeof value !== 'string')
      : []
    if (
      files.length !== 1 ||
      !form ||
      form.get('image') !== files[0] ||
      [...form.keys()].length !== 1 ||
      !files[0].size
    )
      return noStoreJson({ success: false, error: 'Upload one JPEG, PNG or WebP image' }, 400)
    const file = files[0]
    if (file.size > 10 * 1024 * 1024)
      return noStoreJson({ success: false, error: 'Images must be at most 10 MB' }, 413)
    if (imageType(new Uint8Array(await file.slice(0, 12).arrayBuffer())) !== file.type)
      return noStoreJson(
        { success: false, error: 'Only valid JPEG, PNG and WebP images are allowed' },
        415,
      )
  }
  let json: unknown
  if (request.method !== 'GET' && !multipart) {
    try {
      json = JSON.parse(new TextDecoder().decode(await boundedBody(request, 65536)))
      if (!json || Array.isArray(json) || typeof json !== 'object') throw new Error('Invalid JSON')
      const keys =
        path === 'stock'
          ? [
              'addRequestId',
              'registration',
              'mileage',
              'vehicle',
              'price',
              'vatStatus',
              'requiresPrep',
              'attentionGrabber',
              'description',
              'imageIds',
              'channels',
              'feeds',
              'showOnWebsiteSoldPage',
            ]
          : path.endsWith('/price')
            ? ['price', 'vatStatus']
            : path.endsWith('/channels')
              ? ['channels']
              : path.endsWith('/feeds')
                ? ['feedId', 'enabled']
                : ['imageIds']
      if (Object.keys(json).some((key) => !keys.includes(key)))
        return noStoreJson({ success: false, error: 'Unsupported field' }, 400)
    } catch {
      return noStoreJson({ success: false, error: 'Invalid or oversized JSON' }, 400)
    }
  }
  const mutation = request.method !== 'GET' && path !== 'images'
  try {
    const response = await dmsFetch(`/api/website-admin/${path}${request.nextUrl.search}`, {
      method: request.method,
      session,
      ...(request.method === 'GET'
        ? {}
        : multipart
          ? {
              body: new Blob([upload! as BlobPart]).stream(),
              contentType: request.headers.get('content-type')!,
            }
          : { json }),
      timeoutMs: 90_000,
    })
    if (response.status === 401) await clearSession()
    const body = await response
      .json()
      .catch(() => ({ success: false, error: 'The DMS did not respond' }))
    return noStoreJson(body, response.ok && body.success !== true ? 502 : response.status)
  } finally {
    if (mutation) invalidateInventory()
  }
}

export const GET = adminRoute(forward)
export const POST = adminRoute(forward)
export const PATCH = adminRoute(forward)
export const PUT = adminRoute(forward)
