import { NextResponse } from 'next/server'
import { getInventory } from '@/utilities/vehicleInventory'
import { noStoreHeaders } from '@/lib/services/publicListings'
export async function GET() {
  try { const rows = await getInventory(); return NextResponse.json({ results: rows.slice(0,15), totalResults: rows.length, page: 1, pageSize: 15 }, { headers: noStoreHeaders }) }
  catch { return NextResponse.json({ error: 'Inventory temporarily unavailable' }, { status: 503, headers: noStoreHeaders }) }
}
