import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

function resolveTable(os: string | null): 'testes_windows' | 'testes_linux' {
  return os === 'linux' ? 'testes_linux' : 'testes_windows'
}

const ALLOWED_FIELDS = [
  'nome_da_regra', 'configuracao_da_regra', 'executor_da_regra',
  'tipo_de_regra', 'protocolo_parceiro', 'clientes_utilizam_funcionalidade',
  'resultado_esperado', 'detalhamento_da_execucao_do_teste', 'resultado',
  'criticidade_issue', 'issue', 'versao_do_edie', 'build', 'observacoes',
]

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
    const { os, ...fields } = body
    const table = resolveTable(os)

    const updates = Object.keys(fields).filter((k) => ALLOWED_FIELDS.includes(k))
    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    // Read current values before updating (for historico)
    const [oldRows] = await pool.execute(
      `SELECT ${updates.join(', ')} FROM ${table} WHERE id_pk = ?`, [id]
    )
    const oldData = (oldRows as Record<string, string | null>[])[0] ?? {}

    const setClause = updates.map((col) => `${col} = ?`).join(', ')
    const values = [...updates.map((col) => fields[col] ?? null), id]
    await pool.execute(`UPDATE ${table} SET ${setClause} WHERE id_pk = ?`, values)

    // Log each changed field (non-blocking)
    for (const col of updates) {
      const oldVal = String(oldData[col] ?? '')
      const newVal = String(fields[col] ?? '')
      if (oldVal !== newVal) {
        pool.execute(
          `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao, campo_alterado, valor_anterior, valor_novo)
           VALUES (?, ?, 'EDICAO', ?, ?, ?)`,
          [table, id, col, oldVal, newVal]
        ).catch((e) => console.error('[historico PUT]', e))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[testes/[id]/PUT]', error)
    return NextResponse.json({ error: 'Erro ao atualizar regra' }, { status: 500 })
  }
}

export async function DELETE(
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
    const { password, os } = body

    if (!password || password !== process.env.ADMIN_DELETE_PASSWORD) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const table = resolveTable(os)

    // Read nome before delete (for historico)
    const [oldRows] = await pool.execute(
      `SELECT nome_da_regra FROM ${table} WHERE id_pk = ?`, [id]
    )
    const nome = (oldRows as { nome_da_regra: string }[])[0]?.nome_da_regra ?? ''

    await pool.execute(`DELETE FROM ${table} WHERE id_pk = ?`, [id])

    // Also remove from execucao if present
    pool.execute(
      `DELETE FROM regras_em_execucao WHERE tabela_origem = ? AND id_pk = ?`,
      [table, id]
    ).catch(() => {})

    // Log historico (non-blocking)
    pool.execute(
      `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao, campo_alterado, valor_anterior)
       VALUES (?, ?, 'EXCLUSAO', 'nome_da_regra', ?)`,
      [table, id, nome]
    ).catch((e) => console.error('[historico DELETE]', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[testes/[id]/DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir regra' }, { status: 500 })
  }
}
