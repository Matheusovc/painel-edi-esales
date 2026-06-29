import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

type OsParam = 'windows' | 'linux' | 'all' | null

function resolveTable(os: OsParam): 'testes_windows' | 'testes_linux' {
  return os === 'linux' ? 'testes_linux' : 'testes_windows'
}

function buildWhere(search: string, status: string, protocolo: string, tipo: string) {
  const params: string[] = []
  let where = 'WHERE 1=1'
  if (search) {
    where += ' AND (nome_da_regra LIKE ? OR CAST(id AS CHAR) LIKE ? OR executor_da_regra LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (status) { where += ' AND resultado = ?'; params.push(status) }
  if (protocolo) { where += ' AND protocolo_parceiro = ?'; params.push(protocolo) }
  if (tipo) { where += ' AND tipo_de_regra = ?'; params.push(tipo) }
  return { where, params }
}

export async function GET(req: NextRequest) {
  await ensureTables()
  try {
    const { searchParams } = new URL(req.url)
    const os = searchParams.get('os') as OsParam
    const page  = Math.max(1, Number(searchParams.get('page'))  || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const search    = (searchParams.get('search')    || '').trim()
    const status    = (searchParams.get('status')    || '').trim()
    const protocolo = (searchParams.get('protocolo') || '').trim()
    const tipo      = (searchParams.get('tipo')      || '').trim()
    const offset    = (page - 1) * limit

    const { where, params } = buildWhere(search, status, protocolo, tipo)

    if (os === 'all') {
      const doubleParams = [...params, ...params]

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM (
           SELECT id_pk FROM testes_windows ${where}
           UNION ALL
           SELECT id_pk FROM testes_linux ${where}
         ) AS combined`,
        doubleParams
      )
      const total = (countRows as { total: number }[])[0]?.total ?? 0

      const [rows] = await pool.execute(
        `(SELECT *, 'testes_windows' AS tabela_origem FROM testes_windows ${where})
         UNION ALL
         (SELECT *, 'testes_linux' AS tabela_origem FROM testes_linux ${where})
         ORDER BY id_pk DESC LIMIT ${limit} OFFSET ${offset}`,
        doubleParams
      )
      return NextResponse.json({ data: rows, total, page, limit })
    }

    // Single OS
    const table = resolveTable(os)
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM ${table} ${where}`, params
    )
    const total = (countRows as { total: number }[])[0]?.total ?? 0

    const [rows] = await pool.execute(
      `SELECT *, '${table}' AS tabela_origem FROM ${table} ${where}
       ORDER BY id_pk DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    return NextResponse.json({ data: rows, total, page, limit })

  } catch (error) {
    console.error('[testes/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar testes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const body = await req.json()
    const { os, ...fields } = body
    const table = resolveTable(os)

    const columns = [
      'id', 'nome_da_regra', 'configuracao_da_regra', 'executor_da_regra',
      'tipo_de_regra', 'protocolo_parceiro', 'clientes_utilizam_funcionalidade',
      'resultado_esperado', 'detalhamento_da_execucao_do_teste', 'resultado',
      'criticidade_issue', 'issue', 'versao_do_edie', 'build', 'observacoes',
    ]

    const values = columns.map((col) => {
      const val = fields[col]
      if (val === '' || val === undefined || val === null) return null
      if (col === 'id' || (col === 'build' && os === 'linux')) {
        const n = Number(val)
        return Number.isFinite(n) ? n : null
      }
      return val
    })

    const [result] = await pool.execute(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    )
    const insertId = (result as { insertId: number }).insertId

    // Log historico (non-blocking)
    pool.execute(
      `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao, campo_alterado, valor_novo)
       VALUES (?, ?, 'CRIACAO', 'nome_da_regra', ?)`,
      [table, insertId, fields.nome_da_regra ?? '']
    ).catch((e) => console.error('[historico POST]', e))

    return NextResponse.json({ success: true, result }, { status: 201 })
  } catch (error) {
    console.error('[testes/POST]', error)
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 })
  }
}
