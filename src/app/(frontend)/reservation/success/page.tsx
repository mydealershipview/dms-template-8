import Link from 'next/link'
export const metadata = { title: 'Reservation enquiries', robots: { index: false, follow: false } }
export default function ReservationInformation() {
  return <main className="mx-auto max-w-2xl px-6 py-24"><h1 className="text-3xl font-semibold">Reservation enquiries</h1><p className="my-6">We do not take online payments. Please contact the dealership to confirm your vehicle’s availability and discuss a reservation. This page does not confirm a payment or reservation.</p><Link href="/used-cars" className="underline">Browse current vehicles</Link></main>
}
