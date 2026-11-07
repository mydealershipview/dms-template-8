import { afterEach, describe, expect, it, vi } from 'vitest'
import recorded from '../fixtures/dms-stock-feed.json'
const row = (id: string, state = 'FORECOURT', published = true) => ({
  stockId: id,
  metadata: { stockId: id, lifecycleState: state },
  vehicle: {
    make: 'Mercedes-Benz',
    model: 'E-Class',
    yearOfManufacture: 2023,
    odometerReadingMiles: 0,
    vin: 'PRIVATE_VIN',
  },
  adverts: {
    purchasePrice: { amountGBP: 1234 },
    retailAdverts: {
      advertiserAdvert: { status: published ? 'PUBLISHED' : 'NOT_PUBLISHED' },
      suppliedPrice: { amountGBP: 10000 },
      vatStatus: 'Ex VAT',
      totalPrice: { amountGBP: 12000 },
    },
  },
  advertiser: { advertiserId: 'PRIVATE_ADVERTISER' },
  media: { images: [] },
  reserved: state === 'SALE_IN_PROGRESS',
})
const envelope = (
  vehicles: unknown[],
  page = 1,
  totalPages = 1,
  totalResults = vehicles.length,
) => ({
  success: true,
  data: {
    vehicles,
    pagination: { page, pageSize: 100, totalResults, totalPages, hasNextPage: page < totalPages },
  },
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.useRealTimers()
})
function config() {
  vi.stubEnv('DMS_URL', 'https://dms.test')
  vi.stubEnv('DMS_WEBSITE_KEY', 'fixture-key')
}
describe('keyed complete stock and DTO boundary', () => {
  it('reads three pages, deduplicates IDs, sanitizes nested private fields', async () => {
    config()
    const fetcher = vi.fn(async (input: URL) => {
      const page = Number(input.searchParams.get('page'))
      return Response.json(
        envelope(
          Array.from({ length: 100 }, (_, i) => row(String((page - 1) * 99 + i))),
          page,
          3,
          300,
        ),
      )
    })
    vi.stubGlobal('fetch', fetcher)
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    const result = await fetchMyDealershipViewListings()
    expect(result.results).toHaveLength(298)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|purchasePrice|vin|advertiserId/)
    expect(fetcher.mock.calls[0][0].searchParams.get('includeReserved')).toBe('true')
  })
  it('accepts a digit-string totalResults but rejects other non-numeric counts', async () => {
    config()
    const good = envelope([row('s1')]) as any
    good.data.pagination.totalResults = '1'
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(good)))
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    expect((await fetchMyDealershipViewListings()).results).toHaveLength(1)
    const bad = envelope([row('s1')]) as any
    bad.data.pagination.totalResults = '1; drop'
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(bad)))
    await expect(fetchMyDealershipViewListings()).rejects.toThrow('Invalid DMS stock envelope')
  })
  it('accepts the recorded feed after matching the requested pagination', async () => {
    config()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(envelope(recorded.data.vehicles))),
    )
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    expect((await fetchMyDealershipViewListings()).results.length).toBe(
      recorded.data.vehicles.length,
    )
  })
  it.each([
    {},
    { success: false },
    envelope([{}]),
    envelope([row('a')], 1, 51),
    envelope([row('a')], 1, 0),
  ])('refuses malformed or truncated feed %j', async (body) => {
    config()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body)),
    )
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    await expect(fetchMyDealershipViewListings()).rejects.toThrow()
  })
  it('skips one malformed row and accepts authoritative empty', async () => {
    config()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(envelope([{}, row('a')])))
        .mockResolvedValueOnce(Response.json(envelope([], 1, 0))),
    )
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    expect((await fetchMyDealershipViewListings()).results).toHaveLength(1)
    expect((await fetchMyDealershipViewListings()).results).toEqual([])
  })
  it('page-two failure does not return partial inventory or fall back after rejected key', async () => {
    config()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(envelope([row('a')], 1, 2, 101)))
      .mockResolvedValueOnce(new Response('', { status: 401 }))
    vi.stubGlobal('fetch', fetcher)
    const { fetchMyDealershipViewListings } = await import('@/utilities/mydealershipview')
    await expect(fetchMyDealershipViewListings()).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
describe('one cache with bounded stale and mutation generation', () => {
  it('single-flights concurrent reads, replaces old stock with empty, and expires stale stock', async () => {
    config()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T10:00:00Z'))
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(envelope([row('a')])))
    vi.stubGlobal('fetch', fetcher)
    const { getInventory, invalidateInventory, inventoryHealth } =
      await import('@/utilities/vehicleInventory')
    const [a, b] = await Promise.all([getInventory(), getInventory()])
    expect(a).toEqual(b)
    expect(fetcher).toHaveBeenCalledTimes(1)
    fetcher.mockRejectedValue(new Error('offline'))
    vi.advanceTimersByTime(61000)
    expect(await getInventory()).toHaveLength(1)
    await Promise.resolve()
    expect(inventoryHealth().servingStale).toBe(true)
    vi.advanceTimersByTime(12 * 3600000)
    await expect(getInventory()).rejects.toThrow()
    invalidateInventory()
    fetcher.mockResolvedValue(Response.json(envelope([], 1, 0)))
    expect(await getInventory()).toEqual([])
  })
  it('late in-flight responses cannot resurrect invalidated stock', async () => {
    config()
    let resolve!: (value: Response) => void
    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((r) => {
            resolve = r
          }),
      )
      .mockResolvedValueOnce(Response.json(envelope([row('new')])))
    vi.stubGlobal('fetch', fetcher)
    const { getInventory, invalidateInventory } = await import('@/utilities/vehicleInventory')
    const old = getInventory()
    invalidateInventory()
    expect((await getInventory())[0].metadata.stockId).toBe('new')
    resolve(Response.json(envelope([row('old')])))
    expect((await old)[0].metadata.stockId).toBe('new')
  })
  it('uses the strict publication/lifecycle predicate and boolean reserved', async () => {
    const { isPublicVehicle } = await import('@/utilities/vehicleInventory')
    for (const state of ['FORECOURT', 'SALE_IN_PROGRESS'])
      expect(isPublicVehicle(row('1', state) as never)).toBe(true)
    for (const state of ['SOLD', 'DELETED', 'DUE_IN', 'WASTEBIN'])
      expect(isPublicVehicle(row('1', state) as never)).toBe(false)
    expect(isPublicVehicle(row('1', 'FORECOURT', false) as never)).toBe(false)
    expect(isPublicVehicle({ metadata: { lifecycleState: 'FORECOURT' } } as never)).toBe(false)
  })
})
describe('query, price and URL consistency', () => {
  it('handles zero mileage, literal percent names, invalid pagination/ranges/sort', async () => {
    config()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(envelope([row('id-with-hyphens')]))),
    )
    const { queryListings } = await import('@/lib/services/publicListings')
    expect(
      (await queryListings(new URLSearchParams('minMileage=0&maxMileage=0&minPrice=11999')))
        .totalResults,
    ).toBe(1)
    expect((await queryListings(new URLSearchParams('make=100%25'))).totalResults).toBe(0)
    for (const query of [
      'page=NaN',
      'page=1.5',
      'pageSize=101',
      'minPrice=2&maxPrice=1',
      'sortBy=unknown',
      'minYear=Infinity',
    ])
      await expect(queryListings(new URLSearchParams(query))).rejects.toThrow()
  })
  it('uses authoritative VAT totals, POA, fees, highlight fallback and hyphen-safe slugs', async () => {
    const { publicPrice, photoLine } = await import('@/utilities/vehiclePresentation')
    const car = row('uuid-with-hyphens') as never
    expect(publicPrice(car).total).toBe(12000)
    const { vehicleSlug, resolveVehicleSlug, jsonLd } = await import('@/utilities/vehicleSEO')
    expect(resolveVehicleSlug(vehicleSlug(car), [car])).toBe(car)
    expect(resolveVehicleSlug('old-name-uuid-with-hyphens', [car])).toBe(car)
    expect(jsonLd({ description: '</script>' })).not.toContain('</script>')
    expect(JSON.parse(jsonLd({ description: '</script>' }))).toEqual({description:'</script>'})
    expect(photoLine({ ...(car as object), websiteHighlight: ' New highlight ' } as never)).toBe(
      'New highlight',
    )
    expect(
      publicPrice({ adverts: { retailAdverts: { priceOnApplication: true } } } as never).total,
    ).toBe(null)
    expect(
      publicPrice({
        adverts: {
          retailAdverts: {
            suppliedPrice: { amountGBP: 100 },
            vatStatus: 'Ex VAT',
            adminFee: { amountGBP: 20 },
          },
        },
      } as never).total,
    ).toBe(140)
    expect(publicPrice({adverts:{retailAdverts:{suppliedPrice:{amountGBP:100},adminFee:{amountGBP:20},adminFeeOverride:{amountGBP:0}}}} as never).total).toBe(100)
  })
})
