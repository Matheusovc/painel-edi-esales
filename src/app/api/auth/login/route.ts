import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { ensureTables } from '@/lib/migrate'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await ensureTables()
  try {
    const { email, senha } = await req.json()

    if (!email || !senha) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    )
    const users = rows as { id: number; nome: string; email: string; senha_hash: string }[]

    if (users.length === 0) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    const user = users[0]
    const valid = await bcrypt.compare(senha, user.senha_hash)

    if (!valid) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    const token = await signToken({ id: user.id, email: user.email, nome: user.nome })

    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (e) {
    console.error('[auth/login]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
