import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

export async function GET() {
  await ensureTables()
  try {
    const [rows] = await pool.execute(`
      SELECT
        e.id, e.tabela_origem, e.id_pk, e.inicio_execucao,
        COALESCE(w.nome_da_regra,   l.nome_da_regra)   AS nome_da_regra,
        COALESCE(w.protocolo_parceiro, l.protocolo_parceiro) AS protocolo_parceiro,
        COALESCE(w.executor_da_regra,  l.executor_da_regra)  AS executor_da_regra
      FROM regras_em_execucao e
      LEFT JOIN testes_windows w ON e.tabela_origem = 'testes_windows' AND e.id_pk = w.id_pk
      LEFT JOIN testes_linux   l ON e.tabela_origem = 'testes_linux'   AND e.id_pk = l.id_pk
      ORDER BY e.inicio_execucao DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[execucao/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar regras em execução' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const { tabela_origem, id_pk } = await req.json()
    if (!tabela_origem || !id_pk) {
      return NextResponse.json({ error: 'tabela_origem e id_pk são obrigatórios' }, { status: 400 })
    }
    const table = tabela_origem === 'testes_linux' ? 'testes_linux' : 'testes_windows'

    await pool.execute(
      `INSERT INTO regras_em_execucao (tabela_origem, id_pk) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE inicio_execucao = CURRENT_TIMESTAMP`,
      [table, id_pk]
    )

    // Update resultado → Em Andamento
    await pool.execute(
      `UPDATE ${table} SET resultado = 'Em Andamento' WHERE id_pk = ?`,
      [id_pk]
    )

    // Log historico (non-blocking)
    pool.execute(
      `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao, campo_alterado, valor_novo)
       VALUES (?, ?, 'INICIO_EXECUCAO', 'resultado', 'Em Andamento')`,
      [table, id_pk]
    ).catch((e) => console.error('[historico execucao]', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[execucao/POST]', error)
    return NextResponse.json({ error: 'Erro ao iniciar execução' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await ensureTables()
  try {
    const { tabela_origem, id_pk } = await req.json()
    if (!tabela_origem || !id_pk) {
      return NextResponse.json({ error: 'tabela_origem e id_pk são obrigatórios' }, { status: 400 })
    }
    const table = tabela_origem === 'testes_linux' ? 'testes_linux' : 'testes_windows'

    await pool.execute(
      `DELETE FROM regras_em_execucao WHERE tabela_origem = ? AND id_pk = ?`,
      [table, id_pk]
    )

    // Log historico (non-blocking)
    pool.execute(
      `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao)
       VALUES (?, ?, 'FIM_EXECUCAO')`,
      [table, id_pk]
    ).catch((e) => console.error('[historico fim-execucao]', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[execucao/DELETE]', error)
    return NextResponse.json({ error: 'Erro ao encerrar execução' }, { status: 500 })
  }
}
