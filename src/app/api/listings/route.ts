import { NextRequest, NextResponse } from 'next/server'
import { queryListings, QueryError, noStoreHeaders } from '@/lib/services/publicListings'
export async function GET(request: NextRequest) {
  try { return NextResponse.json(await queryListings(request.nextUrl.searchParams), { headers: noStoreHeaders }) }
  catch (error) { return NextResponse.json({ error: error instanceof QueryError ? error.message : 'Inventory temporarily unavailable' }, { status: error instanceof QueryError ? 400 : 503, headers: noStoreHeaders }) }
}
