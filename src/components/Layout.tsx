import { DealerProvider } from '@/config/DealerProvider'
import { getMakesModels } from '@/lib/services/publicListings'
import React from 'react'
import Navigation from './Navigation'
import Footer from './Footer'
import SideWidget from './SideWidget'
import { getDealershipInfo } from '@/lib/services/dealership.service'
import { mapDealershipInfoToContactData } from '@/utilities/dealershipInfo'

type Props = {
  children: React.ReactNode
}

const Layout = async ({ children }: Props) => {
  const fetchAvailableMakesAndModels = async () => {
    try {
      return await getMakesModels()
    } catch (err) {
      console.warn('Navigation stock filters unavailable')
      return { makes: [], models: [] }
    }
  }

  const dealership = await getDealershipInfo()
  const contactData = mapDealershipInfoToContactData(dealership)
  const { makes, models } = await fetchAvailableMakesAndModels()

  return (
    <DealerProvider value={dealership}>
      <Navigation
        contactData={contactData}
        dealershipName={dealership.name}
        dealershipTagline={dealership.tagline}
        logoUrl={dealership.logoUrl}
        isPromotionsEnabled
        makes={makes || []}
        models={models || []}
      />
      <div id="main-content">{children}</div>
      <Footer
        contactData={contactData}
        dealershipName={dealership.name}
        openingHours={dealership.openingHours}
        makes={makes}
        models={models}
      />
      <SideWidget contactData={contactData} makes={makes} models={models} />
    </DealerProvider>
  )
}

export default Layout