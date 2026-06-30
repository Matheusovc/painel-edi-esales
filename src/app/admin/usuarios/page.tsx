'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import {
  Users, Plus, Pencil, KeyRound, UserX, UserCheck,
  Loader2, X, AlertTriangle, CheckCircle2, ShieldCheck, User,
} from 'lucide-react'
import { GlassEffect } from '@/components/ui/liquid-glass'

interface Usuario {
  id: number
  nome: string
  email: string
  role: 'admin' | 'usuario'
  ativo: number
  criado_em: string
}

/* ── Novo Usuário Form (isolado para não travar ao digitar) ── */
const NovoUsuarioForm = memo(function NovoUsuarioForm({ onCreated, onClose }: {
  onCreated: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'usuario' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome completo">
        <input
          autoFocus value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          placeholder="Ex: João Silva"
          className="input-base"
        />
      </Field>
      <Field label="E-mail">
        <input
          type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="joao@esales.com.br"
          className="input-base"
        />
      </Field>
      <Field label="Senha">
        <input
          type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
          placeholder="Mínimo 6 caracteres"
          className="input-base"
        />
      </Field>
      <Field label="Perfil">
        <div className="flex gap-2">
          {(['usuario', 'admin'] as const).map(r => (
            <button
              key={r} type="button"
              onClick={() => setForm(f => ({ ...f, role: r }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                form.role === r
                  ? r === 'admin'
                    ? 'bg-violet-500/20 border-violet-400/30 text-violet-200'
                    : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              {r === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {r === 'admin' ? 'Admin' : 'Usuário'}
            </button>
          ))}
        </div>
      </Field>
      {error && <ErrMsg msg={error} />}
      <div className="flex gap-3 pt-1">
        <GlassEffect variant="card" className="rounded-xl flex-1" onClick={onClose}>
          <div className="flex items-center justify-center py-2.5 text-sm font-medium text-slate-400">Cancelar</div>
        </GlassEffect>
        <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={loading}>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar usuário
          </button>
        </GlassEffect>
      </div>
    </form>
  )
})

/* ── Editar Usuário Form ── */
const EditarUsuarioForm = memo(function EditarUsuarioForm({ usuario, onSaved, onClose }: {
  usuario: Usuario
  onSaved: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ nome: usuario.nome, email: usuario.email, role: usuario.role })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      onSaved(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome completo">
        <input autoFocus value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="input-base" />
      </Field>
      <Field label="E-mail">
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-base" />
      </Field>
      <Field label="Perfil">
        <div className="flex gap-2">
          {(['usuario', 'admin'] as const).map(r => (
            <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                form.role === r
                  ? r === 'admin' ? 'bg-violet-500/20 border-violet-400/30 text-violet-200' : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}>
              {r === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {r === 'admin' ? 'Admin' : 'Usuário'}
            </button>
          ))}
        </div>
      </Field>
      {error && <ErrMsg msg={error} />}
      <div className="flex gap-3 pt-1">
        <GlassEffect variant="card" className="rounded-xl flex-1" onClick={onClose}>
          <div className="flex items-center justify-center py-2.5 text-sm font-medium text-slate-400">Cancelar</div>
        </GlassEffect>
        <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={loading}>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            Salvar
          </button>
        </GlassEffect>
      </div>
    </form>
  )
})

/* ── Trocar Senha Form ── */
const TrocarSenhaForm = memo(function TrocarSenhaForm({ usuario, onClose }: {
  usuario: Usuario
  onClose: () => void
}) {
  const [form, setForm] = useState({ nova_senha: '', senha_admin: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}/senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">Alterando senha de <span className="text-slate-300 font-medium">{usuario.nome}</span></p>
      <Field label="Nova senha">
        <input autoFocus type="password" value={form.nova_senha}
          onChange={e => setForm(f => ({ ...f, nova_senha: e.target.value }))}
          placeholder="Mínimo 6 caracteres" className="input-base" />
      </Field>
      <Field label="Senha de administrador (confirmação)">
        <input type="password" value={form.senha_admin}
          onChange={e => setForm(f => ({ ...f, senha_admin: e.target.value }))}
          placeholder="Senha root do sistema" className="input-base" />
      </Field>
      {error && <ErrMsg msg={error} />}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Senha alterada com sucesso!
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <GlassEffect variant="card" className="rounded-xl flex-1" onClick={onClose}>
          <div className="flex items-center justify-center py-2.5 text-sm font-medium text-slate-400">Cancelar</div>
        </GlassEffect>
        <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={loading || success}>
          <button type="submit" disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Alterar senha
          </button>
        </GlassEffect>
      </div>
    </form>
  )
})

/* ── Página principal ── */
type ModalType = 'novo' | 'editar' | 'senha' | null

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<Usuario | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      const data = await res.json()
      setUsuarios(data.usuarios ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openModal(type: ModalType, u?: Usuario) {
    setSelected(u ?? null)
    setModal(type)
  }

  async function toggleAtivo(u: Usuario) {
    setTogglingId(u.id)
    try {
      await fetch(`/api/admin/usuarios/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: u.ativo ? 0 : 1 }),
      })
      load()
    } finally { setTogglingId(null) }
  }

  const ativos = usuarios.filter(u => u.ativo)
  const inativos = usuarios.filter(u => !u.ativo)

  return (
    <div className="p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest">Administração</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Gestão de Usuários
            </h1>
            <p className="text-sm text-slate-500 mt-1">Crie, edite e gerencie permissões dos usuários do sistema</p>
          </div>
          <GlassEffect variant="nav" className="rounded-xl" onClick={() => openModal('novo')}>
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-200">
              <Plus className="w-4 h-4" />
              Novo Usuário
            </div>
          </GlassEffect>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: usuarios.length, color: 'text-slate-300' },
          { label: 'Ativos', value: ativos.length, color: 'text-emerald-400' },
          { label: 'Inativos', value: inativos.length, color: 'text-slate-500' },
        ].map(s => (
          <GlassEffect key={s.label} variant="card" className="rounded-2xl w-full">
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
              <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          </GlassEffect>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando usuários…
        </div>
      ) : (
        <div className="space-y-6">
          {ativos.length > 0 && (
            <UsersSection title="Ativos" count={ativos.length}>
              <UsersTable
                users={ativos}
                togglingId={togglingId}
                onEdit={u => openModal('editar', u)}
                onSenha={u => openModal('senha', u)}
                onToggle={toggleAtivo}
              />
            </UsersSection>
          )}
          {inativos.length > 0 && (
            <UsersSection title="Inativos" count={inativos.length} muted>
              <UsersTable
                users={inativos}
                togglingId={togglingId}
                onEdit={u => openModal('editar', u)}
                onSenha={u => openModal('senha', u)}
                onToggle={toggleAtivo}
                muted
              />
            </UsersSection>
          )}
          {usuarios.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600">
              <Users className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm mb-5">Nenhum usuário cadastrado.</p>
              <GlassEffect variant="nav" className="rounded-xl" onClick={() => openModal('novo')}>
                <div className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-200">
                  <Plus className="w-4 h-4" /> Criar primeiro usuário
                </div>
              </GlassEffect>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === 'novo' && (
        <Modal title="Novo Usuário" onClose={() => setModal(null)}>
          <NovoUsuarioForm onCreated={load} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'editar' && selected && (
        <Modal title="Editar Usuário" onClose={() => setModal(null)}>
          <EditarUsuarioForm usuario={selected} onSaved={load} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'senha' && selected && (
        <Modal title="Alterar Senha" onClose={() => setModal(null)}>
          <TrocarSenhaForm usuario={selected} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}

function UsersSection({ title, count, children, muted }: {
  title: string; count: number; children: React.ReactNode; muted?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold uppercase tracking-widest ${muted ? 'text-slate-600' : 'text-slate-400'}`}>{title}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${muted ? 'text-slate-600 bg-white/[0.03]' : 'text-blue-300 bg-blue-500/10'}`}>{count}</span>
      </div>
      {children}
    </div>
  )
}

function UsersTable({ users, togglingId, onEdit, onSenha, onToggle, muted }: {
  users: Usuario[]
  togglingId: number | null
  onEdit: (u: Usuario) => void
  onSenha: (u: Usuario) => void
  onToggle: (u: Usuario) => void
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {['Nome', 'E-mail', 'Perfil', 'Desde', 'Ações'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className={`border-b border-white/[0.04] last:border-0 transition-colors ${muted ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
              <td className="px-5 py-3.5">
                <span className="text-sm font-medium text-slate-200">{u.nome}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-sm text-slate-400 font-mono">{u.email}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  u.role === 'admin'
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                }`}>
                  {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {u.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                {new Date(u.criado_em).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <ActionBtn title="Editar" onClick={() => onEdit(u)} color="text-blue-300" icon={<Pencil className="w-3.5 h-3.5" />} />
                  <ActionBtn title="Alterar senha" onClick={() => onSenha(u)} color="text-amber-300" icon={<KeyRound className="w-3.5 h-3.5" />} />
                  <ActionBtn
                    title={u.ativo ? 'Desativar' : 'Reativar'}
                    onClick={() => onToggle(u)}
                    color={u.ativo ? 'text-red-300' : 'text-emerald-300'}
                    icon={togglingId === u.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : u.ativo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionBtn({ title, onClick, icon, color }: {
  title: string; onClick: () => void; icon: React.ReactNode; color: string
}) {
  return (
    <GlassEffect variant="card" className="rounded-lg" onClick={onClick}>
      <div className={`p-2 ${color}`} title={title}>{icon}</div>
    </GlassEffect>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm text-red-300">
      <AlertTriangle className="w-4 h-4 shrink-0" />{msg}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <GlassEffect variant="card" className="rounded-2xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-200">{title}</h3>
              <GlassEffect variant="card" className="rounded-lg" onClick={onClose}>
                <div className="p-1.5 text-slate-400"><X className="w-4 h-4" /></div>
              </GlassEffect>
            </div>
            {children}
          </div>
        </GlassEffect>
      </div>
    </div>
  )
}
