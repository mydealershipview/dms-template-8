import type { AutoTraderVehicle } from './autotrader'
import { toKebabCase } from './toKebabCase'
import { vehiclePrice, vehicleTitle, vehicleImages } from './vehiclePresentation'
export const vehicleSlug = (v: AutoTraderVehicle) =>
  `${toKebabCase(v.vehicle.make || v.vehicle.standard?.make || '')}-${toKebabCase(v.vehicle.model || v.vehicle.standard?.model || '')}-${v.vehicle.yearOfManufacture || v.vehicle.firstRegistrationDate?.split('-')[0] || ''}-${v.metadata.stockId}`
export function resolveVehicleSlug(slug: string, rows: AutoTraderVehicle[]) {
  return (
    rows.find((v) => vehicleSlug(v) === slug) ||
    [...rows]
      .sort((a, b) => b.metadata.stockId.length - a.metadata.stockId.length)
      .find((v) => slug.endsWith(`-${v.metadata.stockId}`))
  )
}
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
export function vehicleSchema(v: AutoTraderVehicle, origin: string) {
  const price = vehiclePrice(v)
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: vehicleTitle(v),
    image: vehicleImages(v),
    vehicleModelDate: v.vehicle.yearOfManufacture,
    brand: { '@type': 'Brand', name: v.vehicle.make },
    model: v.vehicle.model,
    ...(price !== null
      ? {
          offers: {
            '@type': 'Offer',
            url: `${origin}/used-cars/${vehicleSlug(v)}`,
            price,
            priceCurrency: 'GBP',
            availability: v.reserved ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
          },
        }
      : {}),
  }
}
