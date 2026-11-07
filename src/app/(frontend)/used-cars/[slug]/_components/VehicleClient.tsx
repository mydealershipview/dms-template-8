'use client'
import { vehiclePrice,priceLabel,vatLabel } from '@/utilities/vehiclePresentation'
import { StockLabels,VatNote } from '@/components/vehicle/StockLabels'
import { FeaturedCars } from '@/components/home/FeaturedCars'
import { useWishlist } from '@/contexts/WishlistContext'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { AutoTraderVehicle } from '@/utilities/autotrader'

import {
  ReserveModal,
  CallUsModal,
  FinanceModal,
  PartExchangeModal,
  EmailModal,
} from './modals'

interface VehicleClientProps {
  vehicle: AutoTraderVehicle
  dealershipName: string
  phoneNumber: string
  emailAddress: string
  similarProducts?: AutoTraderVehicle[]
}

export default function VehicleClient({
  vehicle,
  dealershipName,
  phoneNumber,
  emailAddress,
  similarProducts = [],
}: VehicleClientProps) {
  const {isInWishlist,toggleWishlist} = useWishlist()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Modal States
  const [showReserve, setShowReserve] = useState(false)
  const [showCallUs, setShowCallUs] = useState(false)
  const [showFinance, setShowFinance] = useState(false)
  const [showPartExchange, setShowPartExchange] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  const make = vehicle.vehicle.make || vehicle.vehicle.standard?.make || ''
  const model = vehicle.vehicle.model || vehicle.vehicle.standard?.model || ''
  const derivative = vehicle.vehicle.derivative || vehicle.vehicle.standard?.derivative || ''
  
  const price = vehiclePrice(vehicle)

  const images = (vehicle.media?.images || []).filter((image) => {
    const href = image?.href?.toLowerCase() || ''
    return href && !href.includes('youtube.com') && !href.includes('youtu.be') && !href.includes('vimeo.com')
  })
  const normalizedImages = images.map(image=>({...image,href:image.href.replace('{resize}','w1200')}))
  const hasImages = images.length > 0
  const activeImage = hasImages ? normalizedImages[activeImageIndex].href : '/placeholder.svg'
  const secondaryImage = hasImages && activeImageIndex + 1 < images.length
    ? normalizedImages[activeImageIndex + 1].href
    : null

  const nextImage = () => setActiveImageIndex((prev) => (prev + 2 >= images.length ? 0 : prev + 2))
  const prevImage = () => setActiveImageIndex((prev) =>
    prev < 2 ? (images.length % 2 === 0 ? images.length - 2 : images.length - 1) : prev - 2
  )

  const calculateMonthlyPayment = (priceValue: number | null) => {
    if (!priceValue || priceValue <= 0) return 'N/A'
    const deposit = priceValue * 0.1
    const loanAmount = priceValue - deposit
    const monthlyRate = 0.099 / 12
    const numPayments = 60
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(monthlyPayment)
  }

  const specRows = [
    { label: 'Reg', value: vehicle.vehicle.registration || 'N/A' },
    { label: 'Year', value: vehicle.vehicle.yearOfManufacture ? vehicle.vehicle.yearOfManufacture.toString() : 'N/A' },
    { label: 'Transmission', value: vehicle.vehicle.transmissionType || vehicle.vehicle.standard?.transmissionType || 'N/A' },
    { label: 'Body Type', value: vehicle.vehicle.bodyType || vehicle.vehicle.standard?.bodyType || 'N/A' },
    { label: 'Fuel Type', value: vehicle.vehicle.fuelType || vehicle.vehicle.standard?.fuelType || 'N/A' },
    { label: 'Engine Size', value: vehicle.vehicle.badgeEngineSizeLitres ? `${vehicle.vehicle.badgeEngineSizeLitres.toFixed(1)}L` : 'N/A' },
    { label: 'Doors', value: vehicle.vehicle.doors ? vehicle.vehicle.doors.toString() : 'N/A' },
    { label: 'Mileage', value: vehicle.vehicle.odometerReadingMiles ? `${new Intl.NumberFormat('en-GB').format(vehicle.vehicle.odometerReadingMiles)} mi` : 'N/A' },
  ]

  return (
    <main className="min-h-screen bg-black text-white pt-22 pb-20">
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-6">
        <div className="mb-3 grid grid-cols-1 gap-3 border border-white/15 p-4 lg:grid-cols-[1fr_auto]">
          <Link href="/used-cars" className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Link>
        </div>

        <div className="relative grid grid-cols-1 overflow-hidden border border-white/15 lg:grid-cols-2">
            {hasImages && images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-black/55 p-2 text-white hover:bg-black/80">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={nextImage} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-black/55 p-2 text-white hover:bg-black/80">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

          <div className="relative h-[320px] bg-zinc-900 sm:h-[420px] lg:h-[560px] xl:h-[620px]">
            <StockLabels vehicle={vehicle}/>
            {hasImages ? (
              <img fetchPriority="high" src={activeImage} alt={`${make} ${model}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.12em] text-zinc-400">
                No Image Available
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 text-xs font-semibold text-zinc-200">
              {images.length > 0
                ? `${activeImageIndex + 1}–${Math.min(activeImageIndex + 2, images.length)} / ${images.length}`
                : '0 / 0'}
            </div>
          </div>

          <div className="h-[320px] border-t border-white/10 bg-zinc-950 sm:h-[420px] lg:h-[560px] lg:border-l lg:border-t-0 xl:h-[620px]">
            {secondaryImage ? (
              <img src={secondaryImage} alt={`${make} ${model} secondary view`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.12em] text-zinc-400">
                More Photos Coming Soon
              </div>
            )}
          </div>
        </div>

        {hasImages && (
          <div className="mb-4 flex gap-2 overflow-x-auto border-x border-b border-white/15 bg-black px-2 py-2 hide-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx % 2 === 0 ? idx : idx - 1)}
                className={`relative h-20 w-30 shrink-0 overflow-hidden border ${
                  idx === activeImageIndex ? 'border-red-500' : 'border-white/20'
                }`}
              >
                <img src={img.href.replace('{resize}','w300')} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="border border-white/12 bg-black p-6 md:p-8">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-400">
              More About {make} {model}
            </p>
            <h1 className="mb-2 text-3xl font-semibold uppercase tracking-[0.06em] text-white md:text-4xl">
              {make} {model}
            </h1>
            {derivative && (
              <p className="mb-6 text-sm uppercase tracking-[0.15em] text-zinc-400">{derivative}</p>
            )}
            {vehicle.adverts?.retailAdverts?.description ? (
              <div className="text-sm leading-7 text-zinc-300">
                {vehicle.adverts.retailAdverts.description}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Description coming soon.</p>
            )}
          </section>

          <aside className="border border-white/12 bg-black p-5">
            <p className="border-b border-red-600 pb-3 text-xs uppercase tracking-[0.14em] text-zinc-400">{dealershipName}</p>
            <h2 className="mt-3 text-4xl font-extrabold uppercase tracking-[0.05em]">{make} {model}</h2>

            <div className="mt-4 grid grid-cols-2 gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Our Price</p>
                <p className="text-4xl font-bold text-white">{priceLabel(vehicle)}{vatLabel(vehicle)}<VatNote vehicle={vehicle}/></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Monthly Price</p>
                <p className="text-3xl font-bold text-red-500">{price ? calculateMonthlyPayment(price) : 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {specRows.map((item) => (
                <div key={item.label} className="grid grid-cols-2 border border-white/10 text-sm">
                  <span className="px-3 py-2 text-zinc-400">{item.label}</span>
                  <span className="px-3 py-2 text-right font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <button type="button" className="mt-4 w-full border border-white/30 px-4 py-3 text-sm" onClick={()=>toggleWishlist({stockId:vehicle.metadata.stockId,title:[make,model].join(' ')})}>{isInWishlist(vehicle.metadata.stockId)?'Remove from saved vehicles':'Save vehicle'}</button>
            <div className="mt-4 grid gap-2">
              <button onClick={() => setShowEmail(true)} className="w-full bg-white py-3 text-sm font-semibold uppercase tracking-[0.12em] text-black hover:bg-zinc-200">
                Enquire Now
              </button>
              <button onClick={() => setShowFinance(true)} className="w-full bg-red-600 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-red-700">
                Apply For Finance
              </button>
              <button onClick={() => setShowCallUs(true)} className="w-full bg-emerald-700 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-emerald-800">
                Request callback
              </button>
              <button onClick={() => setShowReserve(true)} className="w-full bg-red-600 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-red-700">
                Enquire about reserving
              </button>
              <button onClick={() => setShowPartExchange(true)} className="w-full border border-white/25 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10">
                Part Exchange
              </button>
            </div>
          </aside>
        </div>
      </div>

      {similarProducts.length > 0 && <FeaturedCars vehicles={similarProducts} heading="Similar cars"/>}
      {/* Modals */}
      {showReserve && (
        <ReserveModal
          vehicleMake={make}
          vehicleModel={model}
          vehicleReg={vehicle.vehicle.registration || ''}
          vehiclePrice={price}
          stockId={vehicle.metadata?.stockId}
          onClose={() => setShowReserve(false)}
        />
      )}
      {showCallUs && (
        <CallUsModal
          phoneNumber={phoneNumber || ''}
          vehicleMake={make}
          vehicleModel={model}
          vehicleReg={vehicle.vehicle.registration || ''}
          vehiclePrice={price}
          stockId={vehicle.metadata?.stockId}
          onClose={() => setShowCallUs(false)}
        />
      )}
      {showFinance && (
        <FinanceModal
          vehicleMake={make}
          vehicleModel={model}
          vehicleReg={vehicle.vehicle.registration || ''}
          vehiclePrice={price}
          stockId={vehicle.metadata?.stockId}
          onClose={() => setShowFinance(false)}
        />
      )}
      {showPartExchange && (
        <PartExchangeModal
          vehicleMake={make}
          vehicleModel={model}
          vehicleReg={vehicle.vehicle.registration || ''}
          vehiclePrice={price}
          stockId={vehicle.metadata?.stockId}
          onClose={() => setShowPartExchange(false)}
        />
      )}
      {showEmail && (
        <EmailModal
          emailAddress={emailAddress || 'info@dealership.co.uk'}
          vehicleMake={make}
          vehicleModel={model}
          vehicleReg={vehicle.vehicle.registration || ''}
          vehiclePrice={price}
          stockId={vehicle.metadata?.stockId}
          onClose={() => setShowEmail(false)}
        />
      )}
    </main>
  )
}
