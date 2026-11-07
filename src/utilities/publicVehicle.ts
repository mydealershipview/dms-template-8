// Explicit recursive allow-lists: never spread an internal stock/JSONB object.
// The shape follows the AutoTrader stock record dealer website templates are built on
// (metadata, vehicle, adverts.retailAdverts, media, features, highlights, advertiser), so live
// sites keep reading the same paths. Left out on purpose: VIN, engine number, outstanding
// finance, OEM data, purchase/cost/valuation figures, sold price, customer (consumer) details,
// deal IDs, vehicle check/history, response metrics and non-AutoTrader channel states.
type ObjectValue = Record<string, unknown>
const object = (value: unknown): ObjectValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as ObjectValue) : {}
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
export const PUBLIC_VEHICLE_FIELDS = [
  'registration',
  'make',
  'model',
  'generation',
  'derivative',
  'derivativeId',
  'trim',
  'variant',
  'style',
  'subStyle',
  'vehicleType',
  'yearOfManufacture',
  'year',
  'firstRegistrationDate',
  'firstRegistrationMonth',
  'plate',
  'odometerReadingMiles',
  'mileage',
  'hoursUsed',
  'fuelType',
  'bodyType',
  'cabType',
  'transmissionType',
  'drivetrain',
  'driverPosition',
  'wheelbaseType',
  'roofHeightType',
  'doors',
  'seats',
  'colour',
  'interiorColour',
  'exteriorFinish',
  'upholstery',
  'enginePowerBHP',
  'enginePowerPS',
  'engineTorqueNM',
  'engineTorqueLBFT',
  'engineCapacityCC',
  'badgeEngineSizeLitres',
  'badgeEngineSizeCC',
  'cylinders',
  'valves',
  'gears',
  'startStop',
  'emissionClass',
  'euroStatus',
  'rde2Compliant',
  'fuelEconomyNEDCCombinedMPG',
  'fuelEconomyNEDCUrbanMPG',
  'fuelEconomyNEDCExtraUrbanMPG',
  'fuelEconomyWLTPCombinedMPG',
  'fuelEconomyWLTPLowMPG',
  'fuelEconomyWLTPMediumMPG',
  'fuelEconomyWLTPHighMPG',
  'fuelEconomyWLTPExtraHighMPG',
  'fuelCapacityLitres',
  'co2EmissionGPKM',
  'co2Emissions',
  'vehicleExciseDutyWithoutSupplementGBP',
  'batteryRangeMiles',
  'batteryCapacityKWH',
  'batteryUsableCapacityKWH',
  'topSpeedMPH',
  'zeroToSixtyMPHSeconds',
  'zeroToOneHundredKMPHSeconds',
  'lengthMM',
  'widthMM',
  'heightMM',
  'wheelbaseMM',
  'minimumKerbWeightKG',
  'grossVehicleWeightKG',
  'payloadLengthMM',
  'payloadWidthMM',
  'payloadHeightMM',
  'payloadWeightKG',
  'payloadVolumeCubicMetres',
  'bootSpaceSeatsUpLitres',
  'bootSpaceSeatsDownLitres',
  'insuranceGroup',
  'ownershipCondition',
  'exDemo',
  'owners',
  'previousOwners',
  'serviceHistory',
  'warrantyMonthsOnPurchase',
  'manufacturerWarrantyStandardDurationYears',
  'manufacturerWarrantyStandardDistanceMiles',
  'manufacturerWarrantyBatteryDurationYears',
  'manufacturerWarrantyBatteryDistanceMiles',
  'manufacturerWarrantyPaintworkDurationYears',
  'manufacturerWarrantyCorrosionDurationYears',
  'bodyCondition',
  'interiorCondition',
  'tyreCondition',
  'countryOfOrigin',
  // DVLA (public record), merged in by the stock list builder
  'motStatus',
  'motExpiryDate',
  'taxStatus',
  'taxDueDate',
  'dvlaLastChecked',
] as const
const STANDARD_FIELDS = [
  'make',
  'model',
  'generation',
  'derivative',
  'trim',
  'bodyType',
  'fuelType',
  'transmissionType',
  'drivetrain',
  'colour',
  'style',
  'subStyle',
  'cabType',
] as const
/** Top-level fields of the stock list item (flattened copies the templates also read). */
const TOP_LEVEL_FIELDS = [
  'stockId',
  'make',
  'model',
  'derivative',
  'registration',
  'yearOfManufacture',
  'fuelType',
  'transmissionType',
  'bodyType',
  'doors',
  'seats',
  'enginePowerBHP',
  'odometerReadingMiles',
  'colour',
  'lifecycleState',
  'dateOnForecourt',
  'lastUpdated',
  'priceIndicatorRating',
  'motStatus',
  'motExpiryDate',
  'taxStatus',
  'taxDueDate',
  'dvlaLastChecked',
] as const
const METADATA_FIELDS = [
  'stockId',
  'searchId',
  'externalStockId',
  'externalStockReference',
  'lastUpdated',
  'lastUpdatedByAdvertiser',
  'versionNumber',
  'lifecycleState',
  'dateOnForecourt',
] as const
const ADVERT_FIELDS = [
  'forecourtPriceVatStatus',
  'vatScheme',
  'dueDate',
  'manufacturerApproved',
  'twelveMonthsMot',
  'motInsurance',
  'reservationStatus',
  'description',
  'attentionGrabber',
] as const
const RETAIL_ADVERT_FIELDS = [
  'priceOnApplication',
  'price',
  'vatStatus',
  'attentionGrabber',
  'description',
  'description2',
  'priceIndicatorRating',
  'priceCommentary',
  'advertiserVehicleHighlight1',
  'advertiserVehicleHighlight2',
  'advertiserVehicleHighlight3',
] as const
const RETAIL_MONEY_FIELDS = [
  'suppliedPrice',
  'totalPrice',
  'adminFee',
  'adminFeeOverride',
  'manufacturerRRP',
] as const
/** AutoTrader's own channels. `advertiserAdvert` is the dealer's website: sites filter on it. */
const RETAIL_CHANNELS = [
  'autotraderAdvert',
  'advertiserAdvert',
  'locatorAdvert',
  'exportAdvert',
  'profileAdvert',
] as const
const DISPLAY_OPTIONS = [
  'excludePreviousOwners',
  'excludeStrapline',
  'excludeMot',
  'excludeWarranty',
  'excludeInteriorDetails',
  'excludeTyreCondition',
  'excludeBodyCondition',
] as const
const ADVERTISER_FIELDS = ['name', 'segment', 'website', 'phone', 'advertStrapline'] as const
const LOCATION_FIELDS = [
  'addressLineOne',
  'town',
  'county',
  'region',
  'postCode',
  'latitude',
  'longitude',
] as const
const FEATURE_FIELDS = [
  'name',
  'genericName',
  'type',
  'standardName',
  'category',
  'rarityRating',
  'valueRating',
] as const
const MONEY = ['amountGBP', 'amountGBX'] as const
const STATUS = ['status'] as const
/** Primitive values and nulls pass (nulls as before: sites tell "unknown" from "absent"); dates
 *  serialise as ISO strings exactly as `JSON.stringify` did; objects and arrays never pass. */
function pick(value: ObjectValue, keys: readonly string[]) {
  return Object.fromEntries(
    keys
      .filter(
        (key) =>
          value[key] === null ||
          value[key] instanceof Date ||
          ['string', 'number', 'boolean'].includes(typeof value[key]),
      )
      .map((key) => {
        const field = value[key]
        return [key, field instanceof Date ? field.toISOString() : field]
      }),
  )
}
/** A nested object kept only when present: an absent source stays absent, null stays null. */
function pickNested(value: unknown, keys: readonly string[]) {
  if (value === null) return null
  return value && typeof value === 'object' && !Array.isArray(value)
    ? pick(value as ObjectValue, keys)
    : undefined
}
function pickEach(source: ObjectValue, names: readonly string[], keys: readonly string[]) {
  return Object.fromEntries(
    names
      .map((name) => [name, pickNested(source[name], keys)] as const)
      .filter(([, value]) => value !== undefined),
  )
}
/**
 * Reserved as AutoTrader shows it: Sale in progress (shown as Reserved in MYDV), or AutoTrader's reservation
 * flag. The sync stores a Sale in progress car that is still published as FORECOURT, but AutoTrader
 * keeps adverts.reservationStatus = "Reserved" on it (and requires it for Sale in progress).
 */
export function isReservedVehicle(row: ObjectValue): boolean {
  const state = (value: unknown) => String(value ?? '').toUpperCase()
  return (
    state(row.lifecycleState) === 'SALE_IN_PROGRESS' ||
    state(object(row.metadata).lifecycleState) === 'SALE_IN_PROGRESS' ||
    /^reserved$/i.test(String(object(row.adverts).reservationStatus ?? '').trim())
  )
}
export type PublicWebsiteVehicleOptions = {
  /** `includeReserved=true` callers also get `reserved: boolean`. Off: the default shape exactly. */
  withReservedFlag?: boolean
}
export function publicWebsiteVehicle(row: ObjectValue, options: PublicWebsiteVehicleOptions = {}) {
  const sourceVehicle = object(row.vehicle)
  const adverts = object(row.adverts),
    retail = object(adverts.retailAdverts)
  const media = object(row.media)
  const advertiser = object(row.advertiser)
  const standard = pickNested(sourceVehicle.standard, STANDARD_FIELDS)
  return {
    ...pick(row, TOP_LEVEL_FIELDS),
    ...(typeof row.websiteHighlight === 'string' ? { websiteHighlight: row.websiteHighlight } : {}),
    ...(options.withReservedFlag ? { reserved: isReservedVehicle(row) } : {}),
    metadata: pick(object(row.metadata), METADATA_FIELDS),
    vehicle: {
      ...pick(sourceVehicle, PUBLIC_VEHICLE_FIELDS),
      ...(standard !== undefined ? { standard } : {}),
    },
    ...pickEach(row, ['forecourtPrice', 'totalPrice', 'suppliedPrice'], MONEY),
    adverts: {
      ...pick(adverts, ADVERT_FIELDS),
      ...pickEach(adverts, ['forecourtPrice'], MONEY),
      retailAdverts: {
        ...pick(retail, RETAIL_ADVERT_FIELDS),
        ...pickEach(retail, RETAIL_MONEY_FIELDS, MONEY),
        ...pickEach(retail, RETAIL_CHANNELS, STATUS),
        ...pickEach(retail, ['displayOptions'], DISPLAY_OPTIONS),
      },
      ...(adverts.tradeAdverts && typeof adverts.tradeAdverts === 'object'
        ? { tradeAdverts: pickEach(object(adverts.tradeAdverts), ['dealerAuctionAdvert'], STATUS) }
        : {}),
    },
    media: {
      images: list(media.images).map((image) => pick(object(image), ['href', 'url'])),
      ...pickEach(media, ['video', 'spin'], ['href']),
    },
    features: list(row.features).map((feature) => pick(object(feature), FEATURE_FIELDS)),
    highlights: list(row.highlights).map((highlight) =>
      typeof highlight === 'string' ? highlight : pick(object(highlight), ['name', 'description']),
    ),
    ...(row.advertiser && typeof row.advertiser === 'object'
      ? {
          advertiser: {
            ...pick(advertiser, ADVERTISER_FIELDS),
            location: pick(object(advertiser.location), LOCATION_FIELDS),
          },
        }
      : {}),
  }
}
