import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

export async function GET(req: NextRequest) {
  await ensureTables()
  try {
    const { searchParams } = new URL(req.url)
    const tabela  = searchParams.get('tabela')
    const id_pk   = searchParams.get('id_pk')
    const status  = searchParams.get('status')
    const search  = searchParams.get('search')
    const page    = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit   = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)))
    const offset  = (page - 1) * limit

    // Se tabela+id_pk fornecidos → modo por regra (comportamento original)
    if (tabela && id_pk) {
      const [rows] = await pool.execute(
        `SELECT ct.*,
           COALESCE(tl.nome_da_regra, tw.nome_da_regra) AS nome_regra
         FROM casos_teste ct
         LEFT JOIN testes_linux   tl ON ct.tabela_origem = 'testes_linux'   AND ct.id_pk_regra = tl.id_pk
         LEFT JOIN testes_windows tw ON ct.tabela_origem = 'testes_windows' AND ct.id_pk_regra = tw.id_pk
         WHERE ct.tabela_origem = ? AND ct.id_pk_regra = ?
         ORDER BY ct.criado_em DESC`,
        [tabela, Number(id_pk)]
      )
      return NextResponse.json({ data: rows })
    }

    // Modo global — todos os casos com filtros opcionais
    const conditions: string[] = []
    const values: (string | number)[] = []

    if (status && status !== '__all__') { conditions.push('ct.status = ?'); values.push(status) }
    if (search) {
      conditions.push('(COALESCE(tl.nome_da_regra, tw.nome_da_regra) LIKE ? OR ct.responsavel LIKE ? OR ct.protocolo LIKE ?)')
      const like = `%${search}%`
      values.push(like, like, like)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM casos_teste ct
       LEFT JOIN testes_linux   tl ON ct.tabela_origem = 'testes_linux'   AND ct.id_pk_regra = tl.id_pk
       LEFT JOIN testes_windows tw ON ct.tabela_origem = 'testes_windows' AND ct.id_pk_regra = tw.id_pk
       ${where}`,
      values
    )
    const total = (countRows as { total: number }[])[0]?.total ?? 0

    const [rows] = await pool.execute(
      `SELECT ct.*,
         COALESCE(tl.nome_da_regra, tw.nome_da_regra) AS nome_regra
       FROM casos_teste ct
       LEFT JOIN testes_linux   tl ON ct.tabela_origem = 'testes_linux'   AND ct.id_pk_regra = tl.id_pk
       LEFT JOIN testes_windows tw ON ct.tabela_origem = 'testes_windows' AND ct.id_pk_regra = tw.id_pk
       ${where}
       ORDER BY ct.criado_em DESC
       LIMIT ${limit} OFFSET ${offset}`,
      values
    )

    return NextResponse.json({ data: rows, total, page, limit })
  } catch (error) {
    console.error('[casos-teste/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar casos de teste' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const body = await req.json()
    const {
      tabela_origem, id_pk_regra, responsavel, versao_bi,
      protocolo, qtd_arquivos, tamanho_arquivos, observacoes,
    } = body

    if (!tabela_origem || !id_pk_regra) {
      return NextResponse.json({ error: 'tabela_origem e id_pk_regra são obrigatórios' }, { status: 400 })
    }

    const [result] = await pool.execute(
      `INSERT INTO casos_teste
         (tabela_origem, id_pk_regra, responsavel, versao_bi, protocolo, qtd_arquivos, tamanho_arquivos, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tabela_origem, Number(id_pk_regra),
        responsavel || null, versao_bi || null, protocolo || null,
        qtd_arquivos || null, tamanho_arquivos || null, observacoes || null,
      ]
    )

    // Log historico
    pool.execute(
      `INSERT INTO historico_regras (tabela_origem, id_pk_regra, acao)
       VALUES (?, ?, 'CASO_TESTE_CRIADO')`,
      [tabela_origem, Number(id_pk_regra)]
    ).catch((e) => console.error('[historico caso]', e))

    return NextResponse.json({ success: true, result }, { status: 201 })
  } catch (error) {
    console.error('[casos-teste/POST]', error)
    return NextResponse.json({ error: 'Erro ao criar caso de teste' }, { status: 500 })
  }
}
