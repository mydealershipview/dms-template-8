import { boundedBody } from '@/security/body'
import { NextRequest } from 'next/server'
import { adminRoute, noStoreJson } from '@/lightdms/adminRequest'
import { dmsJson } from '@/lightdms/dms'
import { invalidateInventory } from '@/utilities/vehicleInventory'

type Params = { params: Promise<{ stockId: string }> }
const path = (stockId: string) => `/api/website-admin/stock/${encodeURIComponent(stockId)}`

/**
 * The website highlight line for a car (Light DMS spec 7): shown on the vehicle photo, the
 * attention grabber when blank. Website copy is stored by DMS and never sent to AutoTrader. The DMS is
 * asked first, so only a signed-in user can change one of their own dealer's cars.
 */
export const GET = adminRoute(
  async (_request: NextRequest, session: string, { params }: Params) => {
    const { stockId } = await params
    const { vehicle } = await dmsJson<{ vehicle: { websiteHighlight: string } }>(path(stockId), {
      session,
    })
    return noStoreJson({ success: true, websiteHighlight: vehicle.websiteHighlight || '' })
  },
)

export const PUT = adminRoute(async (request: NextRequest, session: string, { params }: Params) => {
  const { stockId } = await params
  const body = (await boundedBody(request, 8192)
    .then((bytes) => JSON.parse(new TextDecoder().decode(bytes)))
    .catch(() => null)) as { websiteHighlight?: unknown } | null
  if (typeof body?.websiteHighlight !== 'string' || body.websiteHighlight.length > 60)
    return noStoreJson({ success: false, error: 'The highlight can be up to 60 characters' }, 400)
  const result = await dmsJson(path(stockId), {
    method: 'PATCH',
    session,
    json: { websiteHighlight: body.websiteHighlight.trim() },
  })
  invalidateInventory()
  return noStoreJson(result)
})
