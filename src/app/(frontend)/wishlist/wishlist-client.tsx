'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWishlist } from '@/contexts/WishlistContext'
import type { AutoTraderVehicle } from '@/utilities/autotrader'
import { vehicleSlug } from '@/utilities/vehicleSEO'
import { priceLabel, vatLabel, vehicleTitle } from '@/utilities/vehiclePresentation'
export default function WishlistClient() {
  const { wishlistItems, removeFromWishlist } = useWishlist(),
    ids = JSON.stringify(wishlistItems.map((item) => item.stockId))
  const [states, setStates] = useState<
    Record<string, { vehicle?: AutoTraderVehicle; unavailable?: boolean; error?: boolean }>
  >({})
  useEffect(() => {
    const abort = new AbortController()
    setStates({})
    void Promise.all(
      (JSON.parse(ids) as string[]).map(async (id) => {
        try {
          const response = await fetch(`/api/listing/${encodeURIComponent(id)}`, {
            signal: abort.signal,
          })
          if (response.status === 404) return [id, { unavailable: true }] as const
          if (!response.ok) throw new Error()
          const body = await response.json()
          return [id, { vehicle: body.vehicle as AutoTraderVehicle }] as const
        } catch {
          return [id, { error: true }] as const
        }
      }),
    ).then((entries) => {
      if (!abort.signal.aborted) setStates(Object.fromEntries(entries))
    })
    return () => abort.abort()
  }, [ids])
  return (
    <main className="min-h-screen bg-[#111110] px-6 pb-20 pt-40 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-semibold">Saved vehicles</h1>
        {!wishlistItems.length && (
          <p>
            No saved vehicles yet.{' '}
            <Link className="underline" href="/used-cars">
              Browse stock
            </Link>
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item) => {
            const state = states[item.stockId],
              vehicle = state?.vehicle
            return (
              <article key={item.stockId} className="border border-white/15 p-6">
                <h2 className="text-xl">{vehicle ? vehicleTitle(vehicle) : item.title}</h2>
                {vehicle ? (
                  <>
                    <p className="my-3">
                      {priceLabel(vehicle)}
                      {vatLabel(vehicle)}
                      {vehicle.reserved ? ' · Reserved' : ''}
                    </p>
                    <Link className="underline" href={`/used-cars/${vehicleSlug(vehicle)}`}>
                      View vehicle
                    </Link>
                  </>
                ) : (
                  <p role="status" className="my-3">
                    {state?.unavailable
                      ? 'This vehicle is no longer available.'
                      : state?.error
                        ? 'Availability could not be verified. Please retry later.'
                        : 'Checking current availability…'}
                  </p>
                )}
                <button
                  type="button"
                  className="mt-5 block text-sm underline"
                  onClick={() => removeFromWishlist(item.stockId)}
                >
                  Remove saved vehicle
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
