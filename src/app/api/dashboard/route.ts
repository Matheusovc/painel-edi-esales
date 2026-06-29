import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [[kpiRows], [statusRows], [soRows], [reprovadosRows]] = await Promise.all([
      pool.execute('SELECT * FROM vw_dashboard LIMIT 1'),
      pool.execute('SELECT * FROM vw_resumo_status ORDER BY total DESC'),
      pool.execute('SELECT * FROM vw_resumo_por_so'),
      pool.execute('SELECT * FROM vw_regras_reprovadas ORDER BY criticidade DESC LIMIT 50'),
    ])

    const kpi = Array.isArray(kpiRows) && kpiRows.length > 0 ? kpiRows[0] : {}

    return NextResponse.json({
      kpi,
      resumoStatus: statusRows,
      resumoSo: soRows,
      reprovadas: reprovadosRows,
    })
  } catch (error) {
    console.error('[dashboard/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 })
  }
}
