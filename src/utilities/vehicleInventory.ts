import 'server-only'
import { cache } from 'react'
import type { AutoTraderVehicle } from './autotrader'
import { fetchMyDealershipViewListings } from './mydealershipview'
import { vehiclePrice } from './vehiclePresentation'
let snapshot: { vehicles: AutoTraderVehicle[]; fetchedAt: number } | undefined
let pending: Promise<AutoTraderVehicle[]> | undefined
let generation = 0
let failedAt: number | undefined
let lastWarningAt = 0
export const maxStaleMs = () => {
  const hours = Number(process.env.STOCK_MAX_STALE_HOURS || 12)
  if (!Number.isFinite(hours) || hours < 1 / 60 || hours > 12)
    throw new Error('STOCK_MAX_STALE_HOURS must be positive and at most 12')
  return hours * 3600000
}
export const isPublicVehicle = (v: AutoTraderVehicle) =>
  ['FORECOURT', 'SALE_IN_PROGRESS'].includes(v.metadata?.lifecycleState) &&
  v.adverts?.retailAdverts?.advertiserAdvert?.status === 'PUBLISHED'
export function inventoryHealth() {
  const age = snapshot ? Date.now() - snapshot.fetchedAt : Infinity
  return {
    feedReachable: !!snapshot && !failedAt,
    lastSuccessfulFeedAt: snapshot ? new Date(snapshot.fetchedAt).toISOString() : null,
    servingStale: !!snapshot && age >= 60000 && age <= maxStaleMs(),
    staleLimitExceeded: age > maxStaleMs(),
  }
}
function refresh(): Promise<AutoTraderVehicle[]> {
  if (pending) return pending
  const version = generation
  const task = (async () => {
    try {
      const { results } = await fetchMyDealershipViewListings()
      if (version !== generation) return getInventory()
      const vehicles = results.filter(isPublicVehicle)
      snapshot = { vehicles, fetchedAt: Date.now() }
      failedAt = undefined
      return vehicles
    } catch (error) {
      if (version !== generation) return getInventory()
      failedAt = Date.now()
      if (Date.now() - lastWarningAt > 300000) {
        console.error('DMS stock unavailable; refresh failed')
        lastWarningAt = Date.now()
      }
      throw new Error('Live vehicle inventory is temporarily unavailable', { cause: error })
    }
  })()
  pending = task
  void task
    .finally(() => {
      if (pending === task) pending = undefined
    })
    .catch(() => {})
  return task
}
export function getInventory(): Promise<AutoTraderVehicle[]> {
  const age = snapshot ? Date.now() - snapshot.fetchedAt : Infinity
  if (snapshot && age < 60000) return Promise.resolve(snapshot.vehicles)
  if (snapshot && age <= maxStaleMs()) {
    void refresh().catch(() => {})
    return Promise.resolve(snapshot.vehicles)
  }
  return refresh()
}
export function invalidateInventory() {
  generation++
  snapshot = undefined
  pending = undefined
}
export const getVehicleDetails = cache(async (stockId: string) => {
  const rows = await getInventory()
  const vehicle = rows.find((v) => v.metadata.stockId === stockId)
  if (!vehicle) return null
  const similarProducts = rows
    .filter((v) => v.metadata.stockId !== stockId && v.vehicle.make === vehicle.vehicle.make)
    .sort(
      (a, b) =>
        Math.abs((vehiclePrice(a) || 0) - (vehiclePrice(vehicle) || 0)) -
        Math.abs((vehiclePrice(b) || 0) - (vehiclePrice(vehicle) || 0)),
    )
    .slice(0, 6)
  return { vehicle, similarProducts, totalSimilar: similarProducts.length }
})
