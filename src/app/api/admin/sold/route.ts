import { boundedBody } from '@/security/body'
import { getPayload } from 'payload'
import config from '@payload-config'
import { adminRoute, noStoreJson } from '@/lightdms/adminRequest'
import { dmsJson } from '@/lightdms/dms'
import { archiveSoldCar, confirmSoldSnapshot, type SoldSnapshot } from '@/lightdms/websiteData'
export const maxDuration = 300

export const GET = adminRoute(async (request, session) => {
  await dmsJson('/api/website-admin/me', { session })
  const payload = await getPayload({ config })
  const rawPage = Number(request.nextUrl.searchParams.get('page') || 1)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const result = await payload.find({
    collection: 'sold-archive',
    where: { removed: { not_equals: true } },
    page,
    limit: 24,
    depth: 0,
    sort: '-updatedAt',
    overrideAccess: true,
  })
  for (const doc of result.docs) {
    if (!doc.confirmed && !doc.cleanupNotifiedAt) {
      const cleanupNotifiedAt = new Date().toISOString()
      await payload.update({
        collection: 'sold-archive',
        id: doc.id,
        data: { cleanupNotifiedAt },
        overrideAccess: true,
      })
      doc.cleanupNotifiedAt = cleanupNotifiedAt
    }
  }
  return noStoreJson({
    success: true,
    docs: result.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      price: doc.price,
      soldDate: doc.soldDate,
      confirmed: doc.confirmed,
      visible: doc.visible,
      copyWarning: doc.copyWarning,
      cleanupNotifiedAt: doc.cleanupNotifiedAt,
    })),
    totalPages: result.totalPages,
  })
})
export const POST = adminRoute(async (request, session) => {
  await dmsJson('/api/website-admin/me', { session })
  const body = (await boundedBody(request, 8192)
    .then((bytes) => JSON.parse(new TextDecoder().decode(bytes)))
    .catch(() => null)) as { id?: string; action?: string } | null
  if (!body?.id || !['hide', 'show', 'remove', 'retry'].includes(body.action || ''))
    return noStoreJson({ success: false, error: 'Choose an archive entry and action' }, 400)
  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection: 'sold-archive',
    id: body.id,
    overrideAccess: true,
  })
  if (body.action === 'retry') {
    const { vehicle } = await dmsJson<{ vehicle: { status: string } }>(
      `/api/website-admin/stock/${encodeURIComponent(doc.stockId)}`,
      { session },
    )
    if (vehicle.status !== 'SOLD')
      return noStoreJson(
        {
          success: false,
          error: 'The DMS has not confirmed this sale. Mark it Sold from My stock first.',
        },
        409,
      )
    const snapshot = await archiveSoldCar({
      ...doc,
      images: Array.isArray(doc.sourceImages)
        ? doc.sourceImages.filter((value): value is string => typeof value === 'string')
        : [],
      soldDate: doc.soldDate.slice(0, 10),
      archivedBy: doc.archivedBy || 'website admin',
    } as SoldSnapshot)
    if (snapshot.warning) return noStoreJson({ success: true, warning: snapshot.warning })
    await confirmSoldSnapshot(snapshot.id, snapshot.revision)
  } else {
    await payload.update({
      collection: 'sold-archive',
      id: doc.id,
      overrideAccess: true,
      data:
        body.action === 'remove'
          ? { removed: true, visible: false, cleanupNotifiedAt: new Date().toISOString() }
          : { visible: body.action === 'show' },
    })
  }
  return noStoreJson({ success: true })
})
