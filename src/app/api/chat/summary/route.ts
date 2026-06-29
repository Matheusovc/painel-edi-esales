import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'

const GARGALO_HOURS = 4

export async function GET() {
  try {
    await ensureTables()

    const [[hojeRows], [gargaloRows]] = await Promise.all([
      pool.execute(`
        SELECT
          COUNT(DISTINCT CONCAT(tabela_origem, ':', id_pk_regra)) AS testadas,
          SUM(CASE WHEN campo_alterado = 'resultado' AND valor_novo = 'Aprovado'   THEN 1 ELSE 0 END) AS aprovadas,
          SUM(CASE WHEN campo_alterado = 'resultado' AND valor_novo = 'Reprovado'  THEN 1 ELSE 0 END) AS reprovadas
        FROM historico_regras
        WHERE DATE(data_hora) = CURDATE()
      `),
      pool.execute(`
        SELECT sub.*
        FROM (
          SELECT
            e.tabela_origem,
            e.id_pk,
            e.inicio_execucao,
            TIMESTAMPDIFF(HOUR, e.inicio_execucao, NOW()) AS horas,
            COALESCE(w.nome_da_regra,      l.nome_da_regra)      AS nome_da_regra,
            COALESCE(w.executor_da_regra,  l.executor_da_regra)  AS executor_da_regra,
            COALESCE(w.protocolo_parceiro, l.protocolo_parceiro) AS protocolo_parceiro
          FROM regras_em_execucao e
          LEFT JOIN testes_windows w ON e.tabela_origem = 'testes_windows' AND e.id_pk = w.id_pk
          LEFT JOIN testes_linux   l ON e.tabela_origem = 'testes_linux'   AND e.id_pk = l.id_pk
        ) sub
        WHERE sub.horas >= ?
        ORDER BY sub.horas DESC
      `, [GARGALO_HOURS]),
    ])

    const hoje = Array.isArray(hojeRows) && hojeRows.length > 0
      ? (hojeRows[0] as Record<string, unknown>)
      : { testadas: 0, aprovadas: 0, reprovadas: 0 }

    return NextResponse.json({
      hoje: {
        testadas:  Number(hoje.testadas  ?? 0),
        aprovadas: Number(hoje.aprovadas ?? 0),
        reprovadas: Number(hoje.reprovadas ?? 0),
      },
      gargalos: Array.isArray(gargaloRows) ? gargaloRows : [],
      gargalo_threshold_horas: GARGALO_HOURS,
    })
  } catch (error) {
    console.error('[chat/summary/GET]', error)
    return NextResponse.json({
      hoje: { testadas: 0, aprovadas: 0, reprovadas: 0 },
      gargalos: [],
      gargalo_threshold_horas: GARGALO_HOURS,
    })
  }
}
