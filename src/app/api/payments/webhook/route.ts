import { NextResponse } from 'next/server'
const unavailable = () => NextResponse.json({ success: false, error: 'Online payments are unavailable. Please send a reservation enquiry.' }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
export const GET = unavailable
export const POST = unavailable
