import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { boundedBody, imageType } from '@/security/body'

/** Fetch only explicitly trusted image origins, with no redirects or unbounded downloads. */
export async function copySoldImages(payload: Payload, urls: string[], stockId: string) {
  const origins = new Set([
    'https://m.atcdn.co.uk',
    'https://m-qa.atcdn.co.uk',
    ...(process.env.DMS_IMAGE_ORIGINS || '')
      .split(',')
      .filter(Boolean)
      .map((value) => new URL(value).origin),
  ])
  const limit = Number(process.env.SOLD_PHOTO_LIMIT || 10)
  if (!Number.isInteger(limit) || limit < 1 || limit > 30)
    throw new Error('SOLD_PHOTO_LIMIT must be 1 to 30')
  const images: Array<{ url: string; mediaId: string | number }> = []
  for (const [index, source] of urls.slice(0, limit).entries()) {
    const url = new URL(source.replace('{resize}', 'w1280'))
    if (url.protocol !== 'https:' || url.username || url.password || !origins.has(url.origin))
      throw new Error('Sold image host is not configured')
    const soldImageKey = createHash('sha256').update(`${stockId}:${url.href}`).digest('hex')
    const existing = await payload.find({
      collection: 'media',
      where: { soldImageKey: { equals: soldImageKey } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]?.url) {
      images.push({ url: existing.docs[0].url, mediaId: existing.docs[0].id })
      continue
    }
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error('Sold image download failed')
    const bytes = await boundedBody(
      new Request('https://image.invalid', {
        method: 'POST',
        body: response.body,
        duplex: 'half',
      } as RequestInit),
      10 * 1024 * 1024,
    )
    const mimetype = imageType(bytes)
    if (!mimetype) throw new Error('Sold image is not a supported image')
    const extension = mimetype.split('/')[1]
    let media
    try {
      media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { soldImageKey, alt: `Sold vehicle ${stockId}, photo ${index + 1}` },
        file: {
          data: Buffer.from(bytes),
          mimetype,
          size: bytes.length,
          name: `sold-${soldImageKey}.${extension}`,
        },
      })
    } catch (error) {
      const winner = (
        await payload.find({
          collection: 'media',
          where: { soldImageKey: { equals: soldImageKey } },
          limit: 1,
          overrideAccess: true,
        })
      ).docs[0]
      if (!winner?.url) throw error
      media = winner
    }
    if (!media.url) throw new Error('Permanent sold image URL missing')
    images.push({ url: media.url, mediaId: media.id })
  }
  return images
}
