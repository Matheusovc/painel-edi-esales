import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, categoria, valor FROM listas ORDER BY categoria, valor'
    )

    const grouped: Record<string, string[]> = {}
    for (const row of rows as { id: number; categoria: string; valor: string }[]) {
      if (!grouped[row.categoria]) grouped[row.categoria] = []
      grouped[row.categoria].push(row.valor)
    }

    return NextResponse.json({ listas: grouped, raw: rows })
  } catch (error) {
    console.error('[listas/GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar listas' }, { status: 500 })
  }
}
