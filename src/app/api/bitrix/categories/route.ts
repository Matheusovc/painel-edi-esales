import { NextResponse } from 'next/server'
import { listCategories } from '@/lib/bitrix'

export async function GET() {
  try {
    const result = await listCategories()
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
