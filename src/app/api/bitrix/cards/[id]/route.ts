import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { closeDeal, getDeal, updateDeal, addComment } from '@/lib/bitrix'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dealId = Number(params.id)
    const deal = await getDeal(dealId)
    return NextResponse.json({ deal })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dealId = Number(params.id)
    const { titulo, comment, fields } = await req.json()

    const bitrixFields: Record<string, unknown> = { ...(fields ?? {}) }
    if (titulo) bitrixFields.TITLE = titulo

    if (Object.keys(bitrixFields).length > 0) await updateDeal(dealId, bitrixFields)
    if (comment) await addComment(dealId, comment)

    if (titulo) {
      await pool.execute('UPDATE bitrix_cards SET titulo = ?, atualizado_em = NOW() WHERE deal_id = ?', [titulo, dealId])
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dealId = Number(params.id)
    await closeDeal(dealId)
    await pool.execute(
      "UPDATE bitrix_cards SET status = 'fechado', atualizado_em = NOW() WHERE deal_id = ?",
      [dealId]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
