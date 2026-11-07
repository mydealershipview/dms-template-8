import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getInventory, getVehicleDetails } from '@/utilities/vehicleInventory'
import { resolveVehicleSlug, vehicleSlug, vehicleSchema, jsonLd } from '@/utilities/vehicleSEO'
import { priceLabel, vehicleTitle } from '@/utilities/vehiclePresentation'
import { getServerSideURL } from '@/utilities/getURL'
import { getDealershipInfo } from '@/lib/services/dealership.service'
import VehicleClient from './_components/VehicleClient'
async function resolve(slug: string) {
  return resolveVehicleSlug(slug, await getInventory())
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const vehicle = await resolve((await params).slug)
  if (!vehicle) return { title: 'Vehicle not found', robots: { index: false, follow: false } }
  const canonical = `${getServerSideURL()}/used-cars/${vehicleSlug(vehicle)}`
  return {
    title: vehicleTitle(vehicle),
    description: `${vehicleTitle(vehicle)}. ${priceLabel(vehicle)}. Contact the dealership for current availability.`,
    alternates: { canonical },
    openGraph: { url: canonical, title: vehicleTitle(vehicle) },
  }
}
export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    vehicle = await resolve(slug)
  if (!vehicle) notFound()
  if (vehicleSlug(vehicle) !== slug) permanentRedirect(`/used-cars/${vehicleSlug(vehicle)}`)
  const [dealer, details] = await Promise.all([
    getDealershipInfo(),
    getVehicleDetails(vehicle.metadata.stockId),
  ])
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(vehicleSchema(vehicle, getServerSideURL())) }}
      />
      <VehicleClient
        vehicle={vehicle}
        phoneNumber={dealer.phone}
        emailAddress={dealer.email}
        dealershipName={dealer.name}
        similarProducts={details?.similarProducts || []}
      />
    </>
  )
}
