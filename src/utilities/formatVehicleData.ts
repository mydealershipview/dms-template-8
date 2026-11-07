import { AutoTraderVehicle } from "./autotrader"
import { FeaturedVehicle } from "@/components/home/featured-vehicles"

import { vehicleSlug } from './vehicleSEO'
export const generateVehicleSlug = (vehicle: AutoTraderVehicle | FeaturedVehicle) => vehicleSlug(vehicle as AutoTraderVehicle)

export const formatPrice = (price: number | null) => {
  if (!price) return 'N/A'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
