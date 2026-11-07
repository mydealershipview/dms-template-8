import { NextResponse } from 'next/server'
export const GET = () => NextResponse.json({ error: 'Not found' }, { status: 404 })
export const POST = GET
