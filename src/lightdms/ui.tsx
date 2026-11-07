'use client'
import { Car, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { labels, type Vehicle } from './types'
export function StatusBadge({ status, inPrep = false }: { status: string; inPrep?: boolean }) {
  return (
    <span className={`ld-status ${inPrep ? 'in-prep' : status.toLowerCase()}`}>
      <span />
      {inPrep ? 'In prep' : labels[status] || 'Other'}
    </span>
  )
}
export function imageUrl(url: string, size: string) {
  try {
    return new URL(url).hostname.endsWith('.atcdn.co.uk')
      ? url.replace(/w\d+h\d+|\{resize\}/, size)
      : url
  } catch {
    return url
  }
}
export function VehiclePhoto({
  url,
  title,
  eager = false,
  size = 'card',
}: {
  url?: string | null
  title: string
  eager?: boolean
  size?: 'card' | 'detail' | 'thumb'
}) {
  const [failed, setFailed] = useState(false)
  return url && !failed ? (
    // CDN renditions are already resized; avoid a second image-proxy hop and compute charge.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl(url, size === 'thumb' ? 'w200h150' : size === 'card' ? 'w480h360' : 'w800h600')}
      alt={title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      width={size === 'thumb' ? 200 : 800}
      height={size === 'thumb' ? 150 : 600}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="ld-photo-placeholder">
      <Car size={36} strokeWidth={1.3} />
      <span>No photo available</span>
    </span>
  )
}
export function StockSkeleton() {
  return (
    <div className="ld-stock-grid" aria-label="Loading stock" role="status">
      {Array.from({ length: 8 }, (_, i) => (
        <div className="ld-card ld-skeleton" key={i}>
          <div className="ld-card-photo" />
          <div className="ld-card-body">
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  )
}
export function VehicleSpecs({ car }: { car: Vehicle }) {
  return (
    <div className="ld-specs">
      {[
        car.year && `${car.year}`,
        car.mileage != null && `${car.mileage.toLocaleString('en-GB')} miles`,
        car.fuelType,
        car.transmissionType,
      ]
        .filter(Boolean)
        .map((spec, i) => (
          <span key={i}>{spec}</span>
        ))}
    </div>
  )
}
export function PhotoCount({ count }: { count: number }) {
  return (
    <span className="ld-photo-count">
      <ImageIcon size={14} />
      {count}
    </span>
  )
}
