import { getInventory } from '@/utilities/vehicleInventory'
import { vehicleSlug } from '@/utilities/vehicleSEO'
import { getServerSideURL } from '@/utilities/getURL'
export const dynamic = 'force-dynamic'
const escape = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
  )
export async function GET() {
  try {
    const rows = await getInventory()
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map((v) => `<url><loc>${escape(`${getServerSideURL()}/used-cars/${vehicleSlug(v)}`)}</loc>${Number.isFinite(Date.parse(v.metadata.lastUpdated)) ? `<lastmod>${escape(new Date(v.metadata.lastUpdated).toISOString())}</lastmod>` : ''}</url>`).join('')}</urlset>`,
      { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store' } },
    )
  } catch {
    return new Response('Inventory temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
