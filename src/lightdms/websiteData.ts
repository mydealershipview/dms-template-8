import { randomUUID } from 'node:crypto'
import { copySoldImages } from './copySoldImages'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { AutoTraderVehicle } from '@/utilities/autotrader'

const payload = () => getPayload({ config: configPromise })

/** The line shown on a car's photo: the website highlight, else the Auto Trader attention grabber. */
export function photoLine(vehicle: AutoTraderVehicle): string | null {
  return (
    vehicle.websiteHighlight?.trim() ||
    vehicle.adverts?.retailAdverts?.attentionGrabber?.trim() ||
    null
  )
}

export type SoldSnapshot = {
  stockId: string
  title: string
  registration?: string | null
  make?: string | null
  model?: string | null
  derivative?: string | null
  year?: number | null
  mileage?: number | null
  fuelType?: string | null
  transmissionType?: string | null
  bodyType?: string | null
  colour?: string | null
  price?: number | null
  vatStatus?: string | null
  highlight?: string | null
  description?: string | null
  images: string[]
  soldDate: string
  archivedBy: string
}

/** Spec 4.2: saved before the DMS is told; public fields only (no VIN). */
export async function archiveSoldCar(
  snapshot: SoldSnapshot,
): Promise<{ id: string | number; created: boolean; revision: string; warning?: string }> {
  const client = await payload()
  const { docs } = await client.find({
    collection: 'sold-archive',
    where: { stockId: { equals: snapshot.stockId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  let images: Array<{ url: string; mediaId: string }> = []
  let warning: string | undefined
  try {
    images = (await copySoldImages(client, snapshot.images, snapshot.stockId)).map((image) => ({
      ...image,
      mediaId: String(image.mediaId),
    }))
  } catch {
    warning =
      'Permanent photos could not be copied. The snapshot stays unconfirmed; retry it in Sold cars.'
    console.error('Sold image copy failed; snapshot retained for retry')
  }
  const existing = docs[0]
  const history = existing
    ? [
        ...(Array.isArray(existing.history) ? existing.history : []),
        { ...existing, history: undefined },
      ]
    : []
  const revision = randomUUID()
  const data = {
    archiveRevision: revision,
    ...snapshot,
    sourceImages: snapshot.images,
    images,
    soldDate: new Date(`${snapshot.soldDate}T12:00:00Z`).toISOString(),
    confirmed: false,
    pendingSince: new Date().toISOString(),
    cleanupNotifiedAt: null,
    visible: true,
    removed: false,
    copyWarning: warning || null,
    history,
  }
  const saved = existing
    ? await client.update({
        collection: 'sold-archive',
        id: existing.id,
        data,
        overrideAccess: true,
      })
    : await client.create({ collection: 'sold-archive', data, overrideAccess: true })
  return { id: saved.id, revision, created: !existing, ...(warning ? { warning } : {}) }
}

export async function confirmSoldSnapshot(id: string | number, revision: string) {
  const client = await payload()
  const updated = await client.db.collections['sold-archive'].updateOne(
    {
      _id: id,
      archiveRevision: revision,
      $or: [{ copyWarning: null }, { copyWarning: { $exists: false } }],
    },
    { $set: { confirmed: true } },
  )
  if (updated.matchedCount !== 1) throw new Error('Snapshot changed or permanent photos need retry')
}

export async function listSoldCars(page = 1, limit = 24) {
  const result = await (
    await payload()
  ).find({
    collection: 'sold-archive',
    where: {
      and: [
        { confirmed: { equals: true } },
        { visible: { not_equals: false } },
        { removed: { not_equals: true } },
      ],
    },
    sort: '-soldDate',
    page,
    limit,
    depth: 0,
    overrideAccess: true,
  })
  return {
    ...result,
    docs: result.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      make: doc.make,
      model: doc.model,
      year: doc.year,
      mileage: doc.mileage,
      fuelType: doc.fuelType,
      transmissionType: doc.transmissionType,
      highlight: doc.highlight,
      soldDate: doc.soldDate,
      images: doc.images?.map((image) => ({ url: image.url })) || [],
    })),
  }
}
