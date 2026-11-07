import 'server-only'
import type { AutoTraderListingResponse, AutoTraderVehicle } from './autotrader'
import { stockConfig } from '@/lib/services/dmsConfig'
import { publicWebsiteVehicle } from './publicVehicle'
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
export async function fetchMyDealershipViewListings(): Promise<AutoTraderListingResponse> {
  const { url: base, key } = stockConfig()
  const found = new Map<string, AutoTraderVehicle>()
  let totalPages = 1
  let expectedTotal: number | undefined
  for (let page = 1; page <= totalPages; page++) {
    const url = new URL(base)
    url.searchParams.set('includeReserved', 'true')
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', '100')
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`DMS stock request failed (${response.status})`)
    const body = await response.json()
    const data = body?.data,
      pagination = data?.pagination
    // The DMS may serialise counts as digit strings; accept those, reject anything else.
    if (pagination && typeof pagination.totalResults === 'string' && /^\d{1,9}$/.test(pagination.totalResults))
      pagination.totalResults = Number(pagination.totalResults)
    if (
      body?.success !== true ||
      !Array.isArray(data?.vehicles) ||
      !pagination ||
      !Number.isInteger(pagination.totalPages) ||
      pagination.totalPages < 0 ||
      pagination.totalPages > 50 ||
      pagination.page !== page ||
      pagination.pageSize !== 100 ||
      !Number.isInteger(pagination.totalResults) ||
      pagination.totalResults < 0 ||
      (expectedTotal !== undefined && pagination.totalResults !== expectedTotal) ||
      (pagination.totalPages === 0 && data.vehicles.length !== 0) ||
      (pagination.totalResults > 0 && data.vehicles.length === 0) ||
      (pagination.totalPages > 0 && pagination.totalPages < page) ||
      pagination.hasNextPage !== (page < pagination.totalPages)
    )
      throw new Error('Invalid DMS stock envelope')
    expectedTotal = pagination.totalResults
    totalPages = pagination.totalPages
    let malformed = 0
    for (const raw of data.vehicles) {
      if (
        !object(raw) ||
        !object(raw.vehicle) ||
        !object(raw.metadata) ||
        !object(raw.adverts) ||
        typeof raw.metadata.stockId !== 'string' ||
        !raw.metadata.stockId.trim() ||
        typeof raw.metadata.lifecycleState !== 'string'
      ) {
        malformed++
        continue
      }
      if (raw.inPrep === true || raw.requiresPrep === true) continue
      // Project recursively; never spread an upstream stock/admin/provider record into public data.
      const row = publicWebsiteVehicle(raw) as unknown as AutoTraderVehicle
      row.reserved = raw.reserved === true
      found.set(row.metadata.stockId, row)
    }
    if (malformed) {
      console.warn('Malformed DMS stock records skipped', { count: malformed })
      if (malformed === data.vehicles.length) throw new Error('Invalid DMS stock records')
    }
  }
  const results = [...found.values()]
  return { results, totalResults: results.length, page: 1, pageSize: results.length }
}
