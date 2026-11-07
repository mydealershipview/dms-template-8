"use client"

import type { AutoTraderVehicle } from '@/utilities/autotrader'
import { vehiclePrice,priceLabel,vatLabel,vehicleTitle } from '@/utilities/vehiclePresentation'
import { vehicleSlug } from '@/utilities/vehicleSEO'
import { StockLabels,VatNote } from '@/components/vehicle/StockLabels'
import Link from 'next/link'

export function FeaturedCars({vehicles=[],heading='Latest Arrivals'}:{vehicles?:AutoTraderVehicle[];heading?:string}) {
 const featured=vehicles.slice(0,4).map(vehicle=>{const total=vehiclePrice(vehicle),rate=.099/12,months=60;return {id:vehicleSlug(vehicle),vehicle,make:vehicle.vehicle.make,model:vehicle.vehicle.model,trim:vehicle.vehicle.derivative,price:priceLabel(vehicle)+vatLabel(vehicle),finance:total?'£'+(total*.9*rate*Math.pow(1+rate,months)/(Math.pow(1+rate,months)-1)).toFixed(2):'',img:vehicle.media?.images?.[0]?.href?.replace('{resize}','w800') || '/placeholder.svg',specs:[vehicle.vehicle.odometerReadingMiles==null?null:vehicle.vehicle.odometerReadingMiles.toLocaleString('en-GB')+' miles',vehicle.vehicle.fuelType,vehicle.vehicle.transmissionType].filter(Boolean)}})
  return (
    <section className="pt-40 md:pt-48 pb-24 bg-[#121212] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-light text-white uppercase tracking-[0.2em]">
            {heading}
          </h2>
        </div>

        {/* CSS Grid layout for stable scaling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">

          {featured.map((car) => (
            <div
              key={car.id}
              className="bg-[#1c1c1c] flex flex-col group h-full w-full"
            >
              {/* Image Section */}
              <Link href={`/used-cars/${car.id}`} className="aspect-[4/3] w-full overflow-hidden relative block bg-black">
                <StockLabels vehicle={car.vehicle}/>
                <img loading="lazy" decoding="async"
                  src={car.img}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              </Link>

              {/* Content Section */}
              <div className="p-6 md:p-8 flex flex-col flex-grow text-center">

                {/* Title */}
                <Link href={`/used-cars/${car.id}`} className="mb-4 block text-white hover:text-zinc-300 transition-colors">
                  <h3 className="text-[13px] md:text-sm font-light tracking-widest uppercase leading-relaxed">
                    {car.make} {car.model} <br />
                    {car.trim}
                  </h3>
                </Link>

                {/* Specs */}
                <div className="flex-grow flex items-center justify-center mb-6">
                  <p className="text-[11px] text-zinc-400 font-light tracking-wide">
                    {car.specs.join(' / ')}
                  </p>
                </div>

                {/* Pricing / Finance Border Container */}
                <div className="flex justify-between items-end border-t border-zinc-800 pt-6 text-white w-full">
                  <div className="text-sm md:text-base font-light tracking-wider">
                    {car.price}<VatNote vehicle={car.vehicle}/>
                  </div>
                  <div className="text-right flex items-baseline">
                    <span className="text-lg md:text-xl font-bold tracking-wider">{car.finance}</span>
                    <span className="text-[10px] text-zinc-400 ml-1 mb-1 font-light lowercase">per month</span>
                  </div>
                </div>

              </div>
            </div>
          ))}

        </div>


      </div>
    </section>
  )
}
