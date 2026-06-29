import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureTables()
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const allowed = [
      'responsavel', 'versao_bi', 'protocolo', 'qtd_arquivos',
      'tamanho_arquivos', 'observacoes', 'status', 'motivo_reprovacao',
      'data_inicio', 'data_fim',
    ]

    const updates = Object.keys(body).filter((k) => allowed.includes(k))
    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 400 })
    }

    const setClause = updates.map((c) => `${c} = ?`).join(', ')
    const values = [...updates.map((c) => body[c] ?? null), id]

    await pool.execute(`UPDATE casos_teste SET ${setClause} WHERE id = ?`, values)

    // Log historico for status changes
    if (body.status) {
      const [rows] = await pool.execute(
        `SELECT tabela_origem, id_pk_regra FROM casos_teste WHERE id = ?`, [id]
      )
      const caso = (rows as {tabela_origem: string, id_pk_regra: number}[])[0]
      if (caso) {
        pool.execute(
          `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao, campo_alterado, valor_novo)
           VALUES (?, ?, 'CASO_TESTE_STATUS', 'status', ?)`,
          [caso.tabela_origem, caso.id_pk_regra, body.status]
        ).catch((e) => console.error('[historico caso status]', e))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[casos-teste/[id]/PUT]', error)
    return NextResponse.json({ error: 'Erro ao atualizar caso de teste' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureTables()
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await pool.execute(`DELETE FROM casos_teste WHERE id = ?`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[casos-teste/[id]/DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir caso de teste' }, { status: 500 })
  }
}
