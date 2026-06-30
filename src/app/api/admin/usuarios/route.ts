import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { ensureTables } from '@/lib/migrate'

export async function GET() {
  await ensureTables()
  try {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, role, ativo, criado_em, atualizado_em FROM usuarios ORDER BY criado_em DESC'
    )
    return NextResponse.json({ usuarios: rows })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const { nome, email, senha, role } = await req.json()

    if (!nome?.trim() || !email?.trim() || !senha?.trim()) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 })
    }
    if (senha.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()])
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(senha, 12)
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, email, senha_hash, role, ativo) VALUES (?, ?, ?, ?, 1)",
      [nome.trim(), email.trim().toLowerCase(), hash, role === 'admin' ? 'admin' : 'usuario']
    ) as unknown as [{ insertId: number }]

    return NextResponse.json({ ok: true, id: result.insertId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
