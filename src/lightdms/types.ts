export type Photo = { imageId: string; url: string }
export type Vehicle = {
  stockId: string
  registration: string | null
  make: string | null
  model: string | null
  derivative: string | null
  year: number | null
  mileage: number | null
  status: string
  inPrep: boolean
  price: number | null
  advertPrice: number | null
  vatStatus: string | null
  fuelType?: string | null
  transmissionType?: string | null
  bodyType?: string | null
  colour?: string | null
  updatedAt?: string | null
  thumbnail: string | null
  imageCount: number
  channels: Record<string, boolean>
  attentionGrabber: string
  description: string
  images: Photo[]
  feeds: { id: string; name: string; enabled: boolean }[]
}
export type Me = {
  user: { name: string | null; email: string | null }
  dealer: { name: string; package?: string; websiteSoldPage?: boolean }
  counts: { all: number; available: number; dueIn: number; saleInProgress: number; sold: number }
  channels: { key: string; label: string }[]
  feeds: { id: string; name: string }[]
}
export const labels: Record<string, string> = {
  ALL: 'All stock',
  AVAILABLE: 'Available',
  DUE_IN: 'Due in',
  SALE_IN_PROGRESS: 'Sale in progress',
  SOLD: 'Sold',
  DELETED: 'Delete',
}
export const pounds = (value: number | null) =>
  value == null
    ? 'Price not set'
    : new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 2,
      }).format(value)
export async function adminApi<T>(
  path: string,
  method = 'GET',
  data?: unknown,
  options?: { signal?: AbortSignal },
): Promise<T & { warning?: string }> {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    signal: options?.signal,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'X-LightDMS': '1',
      ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(data !== undefined ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {}),
  })
  const body = await response.json().catch(() => null)
  if (response.status === 401) {
    window.location.assign('/admin/login?error=expired')
    throw new Error('Please sign in again')
  }
  if (!response.ok || !body || body.success !== true)
    throw new Error(body?.error || 'The request could not be completed. Please try again.')
  return body
}
