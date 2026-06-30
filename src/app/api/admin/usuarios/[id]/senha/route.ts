import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nova_senha, senha_admin } = await req.json()

    if (senha_admin !== process.env.ADMIN_DELETE_PASSWORD) {
      return NextResponse.json({ error: 'Senha de administrador incorreta.' }, { status: 403 })
    }
    if (!nova_senha || nova_senha.length < 6) {
      return NextResponse.json({ error: 'Nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(nova_senha, 12)
    await pool.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, Number(params.id)])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
