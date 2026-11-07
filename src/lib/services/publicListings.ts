import 'server-only'
import { getInventory } from '@/utilities/vehicleInventory'
import { extractMakesAndModelsFromVehicles } from '@/utilities/make-model'
import { vehiclePrice } from '@/utilities/vehiclePresentation'
import type { AutoTraderVehicle } from '@/utilities/autotrader'
export class QueryError extends Error {}
export const noStoreHeaders = { 'Cache-Control': 'no-store' }
export async function getMakesModels() {
  return extractMakesAndModelsFromVehicles(await getInventory())
}
export async function queryListings(query: URLSearchParams) {
  function number(key: string, fallback?: number) {
    const raw = query.get(key)
    if (raw === null) return fallback
    if (!raw.trim()) throw new QueryError(`Invalid ${key}`)
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) throw new QueryError(`Invalid ${key}`)
    return n
  }
  const page = number('page', 1)!,
    pageSize = number('pageSize', 20)!
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new QueryError('Invalid page or pageSize')
  const sort = query.get('sortBy') || 'dateAdded',
    order = query.get('sortOrder') || 'desc'
  if (
    !['price', 'year', 'mileage', 'make', 'model', 'fuelType', 'dateAdded'].includes(sort) ||
    !['asc', 'desc'].includes(order)
  )
    throw new QueryError('Invalid sort')
  const ranges = [
    ['minPrice', 'maxPrice'],
    ['minYear', 'maxYear'],
    ['minMileage', 'maxMileage'],
  ].map(([min, max]) => [number(min), number(max)])
  for (const [min, max] of ranges)
    if (min !== undefined && max !== undefined && min > max) throw new QueryError('Invalid range')
  const texts = ['make', 'model', 'fuelType', 'bodyType', 'transmissionType', 'colour', 'search'].map(
    (key) => [key, query.get(key)] as const,
  )
  if (texts.some(([, value]) => value && value.length > 100))
    throw new QueryError('Filter too long')
  const all = await getInventory()
  const filtered = all.filter((row) => {
    for (const [key, value] of texts) {
      if (!value) continue
      if (key === 'search') {
        if (
          ![row.vehicle.make, row.vehicle.model, row.vehicle.registration, row.vehicle.colour, row.vehicle.derivative]
            .join(' ')
            .toLowerCase()
            .includes(value.toLowerCase())
        )
          return false
      } else if (
        String(row.vehicle[key as keyof AutoTraderVehicle['vehicle']] ?? '').toLowerCase() !==
        value.toLowerCase()
      )
        return false
    }
    const values = [
      vehiclePrice(row),
      row.vehicle.yearOfManufacture,
      row.vehicle.odometerReadingMiles,
    ]
    return ranges.every(([min, max], i) => {
      if (min === undefined && max === undefined) return true
      const v = values[i]
      return (
        typeof v === 'number' &&
        Number.isFinite(v) &&
        (min === undefined || v >= min) &&
        (max === undefined || v <= max)
      )
    })
  })
  function value(v: AutoTraderVehicle): string | number | null {
    if (sort === 'price') return vehiclePrice(v)
    if (sort === 'year') return v.vehicle.yearOfManufacture ?? null
    if (sort === 'mileage') return v.vehicle.odometerReadingMiles ?? null
    if (sort === 'dateAdded') {
      const n = Date.parse(v.metadata.dateOnForecourt || v.metadata.lastUpdated)
      return Number.isFinite(n) ? n : null
    }
    return String(v.vehicle[sort as 'make' | 'model' | 'fuelType'] ?? '').toLowerCase()
  }
  filtered.sort((a, b) => {
    const av = value(a),
      bv = value(b)
    if (av === null && bv !== null) return 1
    if (bv === null && av !== null) return -1
    const diff =
      typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv)
        : Number(av) - Number(bv)
    return (order === 'asc' ? diff : -diff) || a.metadata.stockId.localeCompare(b.metadata.stockId)
  })
  const available = extractMakesAndModelsFromVehicles(all)
  return {
    results: filtered.slice((page - 1) * pageSize, page * pageSize),
    totalResults: filtered.length,
    pageSize,
    page,
    availableMakes: available.makes,
    availableModels: available.models,
  }
}
