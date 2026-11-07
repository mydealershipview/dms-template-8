import { NextResponse } from 'next/server'
const disabled = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
export const GET = disabled
export const POST = disabled
