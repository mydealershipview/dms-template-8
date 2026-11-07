import Link from 'next/link'
import Image from 'next/image'
import { listSoldCars } from '@/lightdms/websiteData'
export const metadata = {
  title: 'Sold cars',
  description: 'A selection of vehicles previously sold by our dealership.',
  alternates: { canonical: '/sold-cars' },
}
export const dynamic = 'force-dynamic'
export default async function SoldCars({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const raw = Number((await searchParams).page || 1),
    page = Number.isInteger(raw) && raw > 0 ? raw : 1
  const result = await listSoldCars(page)
  return (
    <main className="min-h-screen text-white bg-[#111110] px-6 pb-24 pt-40 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm text-[#f87171]">Previously at our showroom</p>
        <h1 className="text-4xl font-semibold tracking-tight lg:text-6xl">Sold cars</h1>
        <p className="mb-12 mt-6 max-w-2xl text-[#a1a1aa]">
          These vehicles have been sold and are no longer available.{' '}
          <Link href="/used-cars" className="underline">
            Browse current stock
          </Link>{' '}
          to find your next car.
        </p>
        {!result.docs.length ? (
          <p>No sold vehicles have been published yet.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {result.docs.map((car) => (
              <article
                key={car.id}
                className="overflow-hidden rounded-lg border border-[#3f3f46] bg-[#181816]"
              >
                {car.images?.[0]?.url && (
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={car.images[0].url}
                      alt={car.title}
                      fill
                      sizes="(max-width:768px) 100vw,33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="mb-2 text-sm font-semibold text-[#f87171]">
                    Sold ·{' '}
                    {new Date(car.soldDate).toLocaleDateString('en-GB', {
                      timeZone: 'Europe/London',
                    })}
                  </p>
                  <h2 className="text-xl font-semibold">{car.title}</h2>
                  <p className="mt-3 text-sm text-[#a1a1aa]">
                    {[
                      car.mileage == null ? null : `${car.mileage.toLocaleString('en-GB')} miles`,
                      car.fuelType,
                      car.transmissionType,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {car.highlight && <p className="mt-3 text-sm">{car.highlight}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
        <nav aria-label="Sold cars pages" className="mt-10 flex gap-6">
          {page > 1 && (
            <Link href={`/sold-cars?page=${page - 1}`} className="underline">
              Previous
            </Link>
          )}
          {page < result.totalPages && (
            <Link href={`/sold-cars?page=${page + 1}`} className="underline">
              Next
            </Link>
          )}
        </nav>
      </div>
    </main>
  )
}
