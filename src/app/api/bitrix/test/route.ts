import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/bitrix'

export async function GET() {
  try {
    const profile = await testConnection()
    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
