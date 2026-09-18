import React from 'react'
import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { AnimatedCard } from '@/components/AnimatedCard'
import Link from 'next/link'
import { getDealershipInfo } from '@/lib/services/dealership.service'

const buildHomeSchema = (dealership: Awaited<ReturnType<typeof getDealershipInfo>>) => {
  const sameAs = Object.values(dealership.social).filter(Boolean)

  return {
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: dealership.name,
      description:
        dealership.seoText ||
        `${dealership.name} is a trusted used car dealership offering quality pre-owned vehicles.`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: [dealership.address.line1, dealership.address.line2].filter(Boolean).join(', '),
        addressLocality: dealership.address.city,
        postalCode: dealership.address.postcode,
        addressCountry: dealership.address.country || 'GB',
      },
      telephone: dealership.phone,
      email: dealership.email,
      sameAs,
      serviceType: ['Used Car Sales', 'Car Finance', 'Part Exchange'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Used Cars',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Car',
              name: 'Quality Used Cars',
            },
          },
        ],
      },
    }),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipInfo()
  const title = `${dealership.name} | Quality Pre-Owned Vehicles`
  const description =
    dealership.seoText || `${dealership.name} - ${dealership.tagline || 'Trusted used car specialists.'}`

  return {
    title,
    description,
    keywords: [
      'used cars',
      'car dealers',
      'used car finance',
      'part exchange',
      dealership.name,
      dealership.address.city,
    ]
      .filter(Boolean)
      .join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_GB',
    },
  }
}

const Home = async () => {
  const dealership = await getDealershipInfo()
  const script = buildHomeSchema(dealership)
  const displayName = dealership.name || 'Dealership'
  const displayTagline = dealership.tagline || 'Trusted used vehicles and support'

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black text-white">
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />
      {/* Structured Data for Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={script}
      />
      
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden shrink-0">
        {/* Video background */}
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/landing.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-0 bg-black/40" />

        {/* Main Content Area - Bottom Banner */}
        <div className="absolute bottom-0 left-0 w-full z-20 flex items-center justify-between pb-8 pt-16 px-6 lg:px-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
          <div className="flex items-start pointer-events-auto">
            {/* Logo mark */}
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-600 mr-4 -skew-x-[24deg] mt-1"></div>
            
            <div className="flex flex-col">
              <h1 className="text-3xl lg:text-4xl font-black tracking-widest uppercase mb-1 drop-shadow-lg">
                {displayName}
              </h1>
              <p className="text-sm lg:text-base text-gray-200 tracking-widest font-medium uppercase drop-shadow-md">
                {displayTagline}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Online Showroom Section */}
      <section className="relative h-screen w-full overflow-clip flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="/car_2.jpg" 
            alt="Online Showroom" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Box */}
        <AnimatedCard>
          <div className="flex items-center mb-3">
            <div className="w-6 h-5 bg-red-600 mr-3 -skew-x-[24deg]"></div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase leading-tight">
              ONLINE <br/> SHOWROOM
            </h2>
          </div>
          <p className="text-base text-gray-300 font-medium mb-6">
            Browse our selection of hand-picked prestige and performance cars
          </p>
          <Link href="/used-cars" className="inline-flex items-center text-sm font-bold tracking-widest hover:text-red-500 transition-colors uppercase gap-2">
            BROWSE SHOWROOM <ChevronRight className="h-4 w-4 text-red-500" />
          </Link>
        </AnimatedCard>
      </section>

      {/* Car Finance Section */}
      <section className="relative h-screen w-full overflow-clip flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="/car.png" 
            alt="Car Finance" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Box */}
        <AnimatedCard>
          <div className="flex items-center mb-3">
            <div className="w-6 h-5 bg-red-600 mr-3 -skew-x-[24deg]"></div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase leading-tight">
              CAR FINANCE
            </h2>
          </div>
          <p className="text-base text-gray-300 font-medium mb-6">
            Finance your next dream car with our packages
          </p>
          <Link href="/finance" className="inline-flex items-center text-sm font-bold tracking-widest hover:text-red-500 transition-colors uppercase gap-2">
            APPLY TODAY! <ChevronRight className="h-4 w-4 text-red-500" />
          </Link>
        </AnimatedCard>
      </section>

      {/* RAC Warranty Section */}
      <section className="relative h-screen w-full overflow-clip flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="/car_3.jpg" 
            alt="RAC Warranty" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Box */}
        <AnimatedCard>
          <div className="flex items-center mb-3">
            <div className="w-6 h-5 bg-red-600 mr-3 -skew-x-[24deg]"></div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase leading-tight">
              RAC WARRANTY
            </h2>
          </div>
          <p className="text-base text-gray-300 font-medium mb-6">
            Protect your car with the UK&apos;s leading warranty provider
          </p>
          <Link href="/warranty" className="inline-flex items-center text-sm font-bold tracking-widest hover:text-red-500 transition-colors uppercase gap-2">
            VIEW PACKAGES <ChevronRight className="h-4 w-4 text-red-500" />
          </Link>
        </AnimatedCard>
      </section>

      {/* Sell Your Car Section */}
      <section className="relative h-screen w-full overflow-clip flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="/car_4.jpg" 
            alt="Sell Your Car" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Box */}
        <AnimatedCard>
          <div className="flex items-center mb-3">
            <div className="w-6 h-5 bg-red-600 mr-3 -skew-x-[24deg]"></div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase leading-tight">
              SELL YOUR CAR
            </h2>
          </div>
          <p className="text-base text-gray-300 font-medium mb-6">
            Sell your sport or prestige car directly to {displayName}
          </p>
          <Link href="/sell" className="inline-flex items-center text-sm font-bold tracking-widest hover:text-red-500 transition-colors uppercase gap-2">
            GET A QUOTE <ChevronRight className="h-4 w-4 text-red-500" />
          </Link>
        </AnimatedCard>
      </section>

      {/* Welcome Section */}
      <section className="relative h-screen w-full overflow-clip flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="/car_5.jpg" 
            alt={`Welcome to ${displayName}`} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Box */}
        <AnimatedCard>
          <div className="flex items-center mb-3">
            <div className="w-6 h-5 bg-red-600 mr-3 -skew-x-[24deg]"></div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase leading-tight">
              WELCOME TO {displayName.toUpperCase()}
            </h2>
          </div>
          <p className="text-base text-gray-300 font-medium mb-6 leading-relaxed">
            {displayName} specialises in supplying prestige and performance vehicles with standout design and confidence-inspiring performance.
          </p>
          <Link href="/about" className="inline-flex items-center text-sm font-bold tracking-widest hover:text-red-500 transition-colors uppercase gap-2">
            READ MORE <ChevronRight className="h-4 w-4 text-red-500" />
          </Link>
        </AnimatedCard>
      </section>
    </main>
  )
}

export default Home
