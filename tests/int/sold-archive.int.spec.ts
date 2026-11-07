import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
const copy = vi.hoisted(() => vi.fn())
vi.mock('@/lightdms/copySoldImages', () => ({ copySoldImages: copy }))
import {
  archiveSoldCar,
  confirmSoldSnapshot,
  listSoldCars,
  type SoldSnapshot,
} from '@/lightdms/websiteData'
let payload: Payload
beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.destroy()
})
const snapshot: SoldSnapshot = {
  stockId: 'sold-fixture',
  title: 'Fixture car',
  images: ['https://m.atcdn.co.uk/original.jpg'],
  soldDate: '2026-10-01',
  archivedBy: 'private@example.test',
  price: 12000,
}
describe('durable sold history with explicit public projection', () => {
  it('keeps failed copies pending, preserves history and guards confirmation generations', async () => {
    copy.mockRejectedValueOnce(new Error('original unavailable'))
    const first = await archiveSoldCar(snapshot)
    expect(first.warning).toMatch(/Permanent photos/)
    expect((await listSoldCars()).docs).toEqual([])
    await expect(confirmSoldSnapshot(first.id, first.revision)).rejects.toThrow()
    copy.mockResolvedValue([{ url: '/api/media/file/owned.jpg', mediaId: 'owned-fixture' }])
    const retry = await archiveSoldCar(snapshot)
    await expect(confirmSoldSnapshot(first.id, first.revision)).rejects.toThrow()
    await confirmSoldSnapshot(retry.id, retry.revision)
    const publicResult = await listSoldCars()
    expect(publicResult.docs).toHaveLength(1)
    expect(JSON.stringify(publicResult.docs)).not.toMatch(
      /private@example|sourceImages|archivedBy|original.jpg|mediaId/,
    )
    expect(publicResult.docs[0].images[0].url).toBe('/api/media/file/owned.jpg')
    const record = await payload.findByID({
      collection: 'sold-archive',
      id: retry.id,
      overrideAccess: true,
    })
    expect(record.history).toHaveLength(1)
    await payload.update({
      collection: 'sold-archive',
      id: retry.id,
      overrideAccess: true,
      data: { visible: false },
    })
    expect((await listSoldCars()).docs).toEqual([])
    await payload.update({
      collection: 'sold-archive',
      id: retry.id,
      overrideAccess: true,
      data: { visible: true, removed: true },
    })
    expect((await listSoldCars()).docs).toEqual([])
  })
})
