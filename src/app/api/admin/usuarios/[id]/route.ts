import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { nome, email, role, ativo } = body

    const sets: string[] = []
    const vals: (string | number)[] = []

    if (nome !== undefined) { sets.push('nome = ?'); vals.push(String(nome).trim()) }
    if (email !== undefined) { sets.push('email = ?'); vals.push(String(email).trim().toLowerCase()) }
    if (role !== undefined) { sets.push('role = ?'); vals.push(role === 'admin' ? 'admin' : 'usuario') }
    if (ativo !== undefined) { sets.push('ativo = ?'); vals.push(ativo ? 1 : 0) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })

    vals.push(id)
    await pool.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    await pool.execute('UPDATE usuarios SET ativo = 0 WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
