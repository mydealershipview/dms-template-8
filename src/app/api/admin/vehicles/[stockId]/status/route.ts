import { boundedBody } from '@/security/body'
import { NextRequest } from 'next/server'
import { adminRoute, noStoreJson } from '@/lightdms/adminRequest'
import { dmsJson } from '@/lightdms/dms'
import { archiveSoldCar, confirmSoldSnapshot } from '@/lightdms/websiteData'
import { invalidateInventory } from '@/utilities/vehicleInventory'

export const maxDuration = 300

type Params = { params: Promise<{ stockId: string }> }
type Detail = {
  vehicle: {
    stockId: string
    registration: string | null
    make: string | null
    model: string | null
    derivative: string | null
    year: number | null
    mileage: number | null
    fuelType: string | null
    transmissionType: string | null
    bodyType: string | null
    colour: string | null
    price: number | null
    vatStatus: string | null
    websiteHighlight?: string
    attentionGrabber: string
    description: string
    images: Array<{ url: string }>
  }
}
type Me = { user: { email: string | null; name: string | null } }

const STATUSES = ['AVAILABLE', 'DUE_IN', 'SALE_IN_PROGRESS', 'SOLD', 'DELETED']

/**
 * Change a car's status from the website admin (Light DMS spec 3, 4 and 5).
 * Sold: when the user chose to keep the car on the Sold Cars page, a snapshot (public fields, no
 * VIN) is saved here first; then the DMS is told, with the sold date, and unpublishes the adverts.
 * Pending snapshots are retained on failure and confirmed after DMS success. The next inventory read uses the updated DMS cache. Reserved cars remain visible;
 * Due In, Sold and Deleted cars are excluded by the shared feed visibility rule.
 */
export const POST = adminRoute(
  async (request: NextRequest, session: string, { params }: Params) => {
    const { stockId } = await params
    const body = (await boundedBody(request, 8192)
      .then((bytes) => JSON.parse(new TextDecoder().decode(bytes)))
      .catch(() => null)) as {
      status?: string
      soldDate?: string
      keepOnSoldPage?: boolean
      channels?: Record<string, boolean>
    } | null
    if (!body?.status || !STATUSES.includes(body.status))
      return noStoreJson({ success: false, error: 'Choose a status' }, 400)
    const soldDate =
      body.soldDate ??
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
    if (
      body.status === 'SOLD' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(soldDate) ||
        Number.isNaN(new Date(soldDate).getTime()) ||
        new Date(soldDate).toISOString().slice(0, 10) !== soldDate ||
        soldDate >
          new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()))
    )
      return noStoreJson({ success: false, error: 'Enter a valid sold date' }, 400)
    const path = `/api/website-admin/stock/${encodeURIComponent(stockId)}`

    let snapshot: {
      id: string | number
      created: boolean
      revision: string
      warning?: string
    } | null = null
    if (body.status === 'SOLD' && body.keepOnSoldPage === true) {
      const [{ vehicle }, me] = await Promise.all([
        dmsJson<Detail>(path, { session }),
        dmsJson<Me>('/api/website-admin/me', { session }),
      ])
      snapshot = await archiveSoldCar({
        stockId,
        title: [vehicle.year, vehicle.make, vehicle.model, vehicle.derivative]
          .filter(Boolean)
          .join(' '),
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        derivative: vehicle.derivative,
        year: vehicle.year,
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
        transmissionType: vehicle.transmissionType,
        bodyType: vehicle.bodyType,
        colour: vehicle.colour,
        price: vehicle.price,
        vatStatus: vehicle.vatStatus,
        highlight: vehicle.websiteHighlight || vehicle.attentionGrabber || null,
        description: vehicle.description || null,
        images: vehicle.images.map((image) => image.url).filter(Boolean),
        soldDate,
        archivedBy: me.user.email ?? me.user.name ?? 'website admin',
      })
    }

    const result = await (async () => {
      try {
        return await dmsJson(`${path}/status`, {
          method: 'PATCH',
          session,
          json: {
            status: body.status,
            ...(body.status === 'SOLD' ? { soldDate } : {}),
            ...(body.channels ? { channels: body.channels } : {}),
          },
        })
      } finally {
        // A timeout may follow a successful provider write. Never serve pre-change stale stock.
        invalidateInventory()
      }
    })()
    // Once the DMS confirms a sale, never roll back its archive, even if local updates fail.
    // A timed-out DMS request also leaves its pending snapshot intact for a safe retry.
    let warning: string | undefined
    try {
      if (snapshot?.warning) throw new Error(snapshot.warning)
      if (snapshot) await confirmSoldSnapshot(snapshot.id, snapshot.revision)
    } catch (error) {
      console.error('DMS status saved; sold archive needs retry')
      warning =
        'The DMS status was saved, but website visibility or the Sold Cars archive could not be updated. Retry this status to finish.'
    }
    invalidateInventory()
    return noStoreJson({
      ...result,
      keptOnSoldPage: !!snapshot && !warning,
      ...(warning ? { warning } : {}),
    })
  },
)
