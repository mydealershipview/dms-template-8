import { randomUUID } from 'node:crypto'
/** Human-run migration for pre-template snapshots. Dry-run by default, no source records deleted. */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { copySoldImages } from '../src/lightdms/copySoldImages'
const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
let page = 1
let candidates = 0
try {
  for (;;) {
    const result = await payload.find({ collection: 'sold-archive', page, limit: 50, sort: 'id', overrideAccess: true })
    for (const doc of result.docs) {
      if (!doc.images?.length || doc.images.every(image => !!image.mediaId)) continue
      candidates++
      if (!apply) continue
      const sourceImages = doc.images.map(image => image.url)
      try {
        const images = await copySoldImages(payload, sourceImages, doc.stockId)
        await payload.update({ collection: 'sold-archive', id: doc.id, overrideAccess: true,
          data: { archiveRevision: doc.archiveRevision || randomUUID(), sourceImages, images: images.map(image => ({ ...image, mediaId: String(image.mediaId) })), copyWarning: null } })
      } catch {
        await payload.update({ collection: 'sold-archive', id: doc.id, overrideAccess: true,
          data: { archiveRevision: doc.archiveRevision || randomUUID(), sourceImages, confirmed: false, pendingSince: new Date().toISOString(), copyWarning: 'Legacy photos could not be preserved. Retry in Sold cars or contact support.' } })
        console.error('A legacy snapshot needs photo recovery; retained unconfirmed')
      }
    }
    if (!result.hasNextPage) break
    page++
  }
  console.info(`${apply ? 'Processed' : 'Would process'} ${candidates} legacy snapshots`)
} finally { await payload.destroy() }
