import { NextRequest, NextResponse } from 'next/server'
import { getVehicleDetails } from '@/utilities/vehicleInventory'
import { noStoreHeaders } from '@/lib/services/publicListings'
export async function GET(_request: NextRequest, { params }: { params: Promise<{ stockId: string }> }) {
  try {
    const details = await getVehicleDetails((await params).stockId)
    return NextResponse.json(details || { error: 'Vehicle not found' }, { status: details ? 200 : 404, headers: noStoreHeaders })
  } catch { return NextResponse.json({ error: 'Inventory temporarily unavailable' }, { status: 503, headers: noStoreHeaders }) }
}
