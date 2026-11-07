interface AutoTraderMakesResponse {
  makes: Array<{
    makeId: string
    name: string
  }>
}

interface AutoTraderModelsResponse {
  models: Array<{
    modelId: string
    name: string
  }>
}

interface AutoTraderListingResponse {
  results: AutoTraderVehicle[]
  totalResults: number
  pageSize?: number
  page?: number
}

interface PublicVehicle {
  reserved?: boolean
  websiteHighlight?: string
  stockId?: string

  vehicle: {
    ownershipCondition: string
    registration: string | null
    make: string
    model: string
    generation: string | null
    derivative: string | null
    derivativeId: string | null
    vehicleType: string
    trim: string | null
    bodyType: string | null
    fuelType: string
    transmissionType: string
    drivetrain: string | null
    seats: number | null
    doors: number | null
    cylinders: number | null
    co2EmissionGPKM: number | null
    topSpeedMPH: number | null
    zeroToSixtyMPHSeconds: number | null
    badgeEngineSizeLitres: number | null
    engineCapacityCC: number | null
    enginePowerBHP: number | null
    fuelCapacityLitres: number | null
    emissionClass: string | null
    owners: number | null
    fuelEconomyNEDCCombinedMPG: number | null
    fuelEconomyWLTPCombinedMPG: number | null
    bootSpaceSeatsUpLitres: number | null
    insuranceGroup: string | null
    firstRegistrationDate: string | null
    colour: string | null
    style: string | null
    odometerReadingMiles: number | null
    motExpiryDate: string | null
    warrantyMonthsOnPurchase: number | null
    serviceHistory: string | null
    plate: string | null
    yearOfManufacture: number | null
    standard: {
      make: string
      model: string
      generation: string | null
      derivative: string | null
      trim: string | null
      bodyType: string
      fuelType: string
      transmissionType: string
      colour: string | null
      style: string | null
    }
  }
  advertiser: {
    name: string
    segment: string
    website: string
    phone: string
    location: {
      addressLineOne: string
      town: string
      county: string | null
      region: string
      postCode: string
      latitude: number
      longitude: number
    }
  }
  adverts: {
    forecourtPrice: {
      amountGBP: number | null
    }
    forecourtPriceVatStatus?: string | null
    vatScheme?: string | null
    dueDate?: string | null
    manufacturerApproved?: boolean
    twelveMonthsMot?: boolean
    motInsurance?: string | null
    reservationStatus?: string | null
    retailAdverts: {
      price?: { amountGBP?: number | null }
      priceOnApplication: boolean
      suppliedPrice: {
        amountGBP: number | null
        amountGBX: number | null
      }
      totalPrice: {
        amountGBP: number | null
      }
      reservePrice?: number | null
      adminFee?: {
        amountGBP: number | null
      }
      adminFeeOverride?: {
        amountGBP: number | null
      }
      manufacturerRRP?: {
        amountGBP: number | null
      }
      vatStatus?: string | null
      attentionGrabber?: string | null
      description: string | null
      description2?: string | null
      priceIndicatorRating: string
      priceIndicatorRatingBands?: any
      autotraderAdvert: {
        status: string
        eligibleContractAllowances?: Array<{
          type: string
        }>
        allocatedContractAllowance?: {
          type: string | null
        }
      }
      advertiserAdvert?: {
        status: string
      }
      locatorAdvert?: {
        status: string
      }
      exportAdvert?: {
        status: string
      }
      profileAdvert?: {
        status: string
      }
      displayOptions?: {
        excludePreviousOwners: boolean
        excludeStrapline: boolean
        excludeMot: boolean
        excludeWarranty: boolean
        excludeInteriorDetails: boolean
        excludeTyreCondition: boolean
        excludeBodyCondition: boolean
      }
      financeOffers?: any
    }
    tradeAdverts?: {
      dealerAuctionAdvert: {
        status: string
      }
    }
  }
  metadata: {
    stockId: string
    searchId: string
    externalStockId: string | null
    lastUpdated: string
    versionNumber: number
    lifecycleState: string
    dateOnForecourt: string
  }
  features: Array<{
    name: string
    type: string
    standardName: string
    category: string
    rarityRating: string
    valueRating: string
  }>
  highlights: string[]
  media: {
    images: Array<{
      href: string
      templated: boolean
    }>
    video: {
      href: string | null
    }
    spin: {
      href: string | null
    }
  }
}

/** Legacy type name retained for existing template components. No provider runtime. */
type AutoTraderVehicle = PublicVehicle
export type { PublicVehicle, AutoTraderVehicle, AutoTraderListingResponse, AutoTraderMakesResponse, AutoTraderModelsResponse }
