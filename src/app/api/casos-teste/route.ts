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
      `SELECT * FROM casos_teste
       WHERE tabela_origem = ? AND id_pk_regra = ?
       ORDER BY criado_em DESC`,
      [tabela, Number(id_pk)]
    )

    return NextResponse.json({ data: rows })
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
