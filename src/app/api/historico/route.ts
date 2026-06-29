import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

export async function GET(req: NextRequest) {
  await ensureTables()
  try {
    const { searchParams } = new URL(req.url)
    const tabela = searchParams.get('tabela')
    const id_pk = searchParams.get('id_pk')

    if (!tabela || !id_pk) {
      return NextResponse.json({ error: 'tabela e id_pk são obrigatórios' }, { status: 400 })
    }

    const [rows] = await pool.execute(
      `SELECT * FROM historico_regras
       WHERE tabela_origem = ? AND id_pk_regra = ?
       ORDER BY data_hora DESC
       LIMIT 200`,
      [tabela, Number(id_pk)]
    )

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[historico/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
