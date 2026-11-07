import WishlistClient from './wishlist-client'
import { Metadata } from 'next'
import { getDealershipInfo } from '@/lib/services/dealership.service'

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipInfo()

  return {
    title: `Wishlist | ${dealership.name || 'Dealership'}`,
    description: `View your saved vehicles and compare your favourites at ${dealership.name || 'our dealership'}.`,
  }
}

export default function Wishlist() {
  return <WishlistClient/>
}
