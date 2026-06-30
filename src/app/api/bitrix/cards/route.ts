import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { createDeal } from '@/lib/bitrix'
import { ensureTables } from '@/lib/migrate'

export async function GET() {
  await ensureTables()
  try {
    const [rows] = await pool.execute(`
      SELECT b.*,
        COALESCE(tl.nome_da_regra, tw.nome_da_regra) AS nome_regra,
        COALESCE(tl.resultado, tw.resultado) AS resultado
      FROM bitrix_cards b
      LEFT JOIN testes_linux tl ON b.tabela_origem = 'testes_linux' AND b.id_pk_regra = tl.id_pk
      LEFT JOIN testes_windows tw ON b.tabela_origem = 'testes_windows' AND b.id_pk_regra = tw.id_pk
      ORDER BY b.criado_em DESC
      LIMIT 100
    `)
    return NextResponse.json({ cards: rows })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const body = await req.json()
    const { tabela_origem, id_pk_regra, titulo, categoryId, stageId, comment } = body

    if (!tabela_origem || !id_pk_regra || !titulo || !categoryId) {
      return NextResponse.json({ error: 'Campos obrigatórios: tabela_origem, id_pk_regra, titulo, categoryId' }, { status: 400 })
    }

    const dealId = await createDeal({ title: titulo, categoryId, stageId, comment })

    await pool.execute(
      `INSERT INTO bitrix_cards (tabela_origem, id_pk_regra, deal_id, titulo)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE deal_id = VALUES(deal_id), titulo = VALUES(titulo), status = 'aberto', atualizado_em = NOW()`,
      [tabela_origem, id_pk_regra, dealId, titulo]
    )

    return NextResponse.json({ ok: true, deal_id: dealId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  await ensureTables()
  try {
    const { deal_id, titulo, comment } = await req.json()
    if (!deal_id) return NextResponse.json({ error: 'deal_id obrigatório' }, { status: 400 })

    const { updateDeal, addComment } = await import('@/lib/bitrix')
    const fields: Record<string, unknown> = {}
    if (titulo) fields.TITLE = titulo

    if (Object.keys(fields).length > 0) await updateDeal(deal_id, fields)
    if (comment) await addComment(deal_id, comment)

    if (titulo) {
      await pool.execute('UPDATE bitrix_cards SET titulo = ?, atualizado_em = NOW() WHERE deal_id = ?', [titulo, deal_id])
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

