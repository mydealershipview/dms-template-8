import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { copySoldImages } from '@/lightdms/copySoldImages'
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
describe('permanent sold media', () => {
  it('stores owned URLs, and safely reuses an already copied image without downloading it', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 'owned', url: '/api/media/file/permanent.jpg' }] })
    const create = vi.fn(async () => ({ id: 'owned', url: '/api/media/file/permanent.jpg' }))
    const fetcher = vi.fn(
      async () => new Response(Uint8Array.from([255, 216, 255, 0]), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetcher)
    const payload = { find, create } as unknown as Payload
    const urls = ['https://m.atcdn.co.uk/a/{resize}/photo.jpg']
    expect(await copySoldImages(payload, urls, 'stock1')).toEqual([
      { url: '/api/media/file/permanent.jpg', mediaId: 'owned' },
    ])
    expect(await copySoldImages(payload, urls, 'stock1')).toEqual([
      { url: '/api/media/file/permanent.jpg', mediaId: 'owned' },
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledTimes(1)
  })
  it('rejects untrusted image hosts, HTTP and non-image bodies', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [] })) } as unknown as Payload
    await expect(copySoldImages(payload, ['http://127.0.0.1/private'], 'stock1')).rejects.toThrow(
      'host',
    )
    await expect(
      copySoldImages(payload, ['https://attacker.test/photo'], 'stock1'),
    ).rejects.toThrow('host')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not an image')),
    )
    await expect(
      copySoldImages(payload, ['https://m.atcdn.co.uk/photo'], 'stock1'),
    ).rejects.toThrow('supported image')
  })
})
