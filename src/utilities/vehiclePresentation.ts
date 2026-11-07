import type { AutoTraderVehicle } from './autotrader'
const positive = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
const nonnegative = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
export function publicPrice(listing: AutoTraderVehicle) {
  const retail = listing.adverts?.retailAdverts
  const vat = String(retail?.vatStatus ?? listing.adverts?.forecourtPriceVatStatus ?? '')
    .trim()
    .toLowerCase()
  const base =
    positive(retail?.suppliedPrice?.amountGBP) ??
    positive(retail?.price?.amountGBP) ??
    positive(listing.adverts?.forecourtPrice?.amountGBP)
  const onApplication = retail?.priceOnApplication === true
  const fee =
    nonnegative(retail?.adminFeeOverride?.amountGBP) ?? nonnegative(retail?.adminFee?.amountGBP) ?? 0
  const total = onApplication
    ? null
    : (positive(retail?.totalPrice?.amountGBP) ??
      (base === null ? null : Math.round((base * (vat === 'ex vat' ? 1.2 : 1) + fee) * 100) / 100))
  return { total, base, vat, onApplication }
}
export const vehiclePrice = (v: AutoTraderVehicle) => publicPrice(v).total
export const priceLabel = (v: AutoTraderVehicle) => {
  const p = publicPrice(v)
  return p.onApplication
    ? 'Price on application'
    : p.total === null
      ? 'Price not set'
      : `£${p.total.toLocaleString('en-GB')}`
}
export const vatLabel = (v: AutoTraderVehicle) =>
  ['inc vat', 'ex vat'].includes(publicPrice(v).vat) ? ' inc. VAT' : ''
export const exVatNote = (v: AutoTraderVehicle) => {
  const p = publicPrice(v)
  return p.vat === 'ex vat' && p.base !== null ? `£${p.base.toLocaleString('en-GB')} + VAT` : null
}
export const photoLine = (v: AutoTraderVehicle) =>
  v.websiteHighlight?.trim() || v.adverts?.retailAdverts?.attentionGrabber?.trim() || null
export const vehicleTitle = (v: AutoTraderVehicle) =>
  [
    v.vehicle.yearOfManufacture,
    v.vehicle.make || v.vehicle.standard?.make,
    v.vehicle.model || v.vehicle.standard?.model,
    v.vehicle.derivative,
  ]
    .filter(Boolean)
    .join(' ')
export const vehicleImages = (v: AutoTraderVehicle) =>
  v.media?.images?.filter((i) => i.href).map((i) => i.href.replace('{resize}', 'w1200')) || []
