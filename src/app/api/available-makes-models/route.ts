import { NextResponse } from 'next/server'
import { getMakesModels, noStoreHeaders } from '@/lib/services/publicListings'
export async function GET() {
  try { return NextResponse.json(await getMakesModels(), { headers: noStoreHeaders }) }
  catch { return NextResponse.json({ error: 'Inventory temporarily unavailable' }, { status: 503, headers: noStoreHeaders }) }
}
