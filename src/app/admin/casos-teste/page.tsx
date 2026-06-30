'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import {
  FlaskConical, Search, Loader2, Play, CheckCircle2, XCircle,
  RotateCcw, Trash2, Clock, X, AlertTriangle, Monitor, Terminal,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { GlassEffect } from '@/components/ui/liquid-glass'
import { cn } from '@/lib/utils'
import type { CasoTeste } from '@/types'

interface CasoComRegra extends CasoTeste {
  nome_regra: string | null
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  Pendente:      { label: 'Pendente',      color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20' },
  'Em Andamento':{ label: 'Em Andamento',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  Aprovado:      { label: 'Aprovado',      color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Reprovado:     { label: 'Reprovado',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

const STATUS_LIST = ['__all__', 'Pendente', 'Em Andamento', 'Aprovado', 'Reprovado']

/* ── Motivo de reprovação (form isolado) ── */
const MotivoForm = memo(function MotivoForm({ onConfirm, onClose }: {
  onConfirm: (motivo: string) => void
  onClose: () => void
}) {
  const [motivo, setMotivo] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Descreva o problema encontrado:</p>
      <textarea
        autoFocus rows={3} value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Ex: Arquivo não foi processado corretamente..."
        className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/50 resize-none"
      />
      <div className="flex gap-3">
        <GlassEffect variant="card" className="rounded-xl flex-1" onClick={onClose}>
          <div className="flex items-center justify-center py-2.5 text-sm text-slate-400">Cancelar</div>
        </GlassEffect>
        <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={!motivo.trim()}>
          <button
            onClick={() => motivo.trim() && onConfirm(motivo.trim())}
            disabled={!motivo.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-300 bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" /> Confirmar Reprovação
          </button>
        </GlassEffect>
      </div>
    </div>
  )
})

/* ── Página principal ── */
export default function CasosTestePage() {
  const [casos, setCasos] = useState<CasoComRegra[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [motivoTarget, setMotivoTarget] = useState<number | null>(null)
  const [actioning, setActioning] = useState<number | null>(null)
  const limit = 50
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== '__all__') p.set('status', statusFilter)
      if (search.trim()) p.set('search', search.trim())
      const res = await fetch(`/api/casos-teste?${p}`)
      const data = await res.json()
      setCasos(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [page, statusFilter, search])

  useEffect(() => { setPage(1) }, [statusFilter, search])
  useEffect(() => { load() }, [load])

  async function updateStatus(id: number, status: string, extra?: Record<string, string>) {
    setActioning(id)
    try {
      const body: Record<string, string> = { status, ...extra }
      if (status === 'Em Andamento') body.data_inicio = now()
      if (status === 'Aprovado' || status === 'Reprovado') body.data_fim = now()
      await fetch(`/api/casos-teste/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      load()
    } finally { setActioning(null) }
  }

  async function handleDelete(id: number) {
    setActioning(id)
    try {
      await fetch(`/api/casos-teste/${id}`, { method: 'DELETE' })
      load()
    } finally { setActioning(null) }
  }

  // stats from current full data (count by status from total, not just visible page)
  const counts = casos.reduce((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest">Administração</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Casos de Teste
        </h1>
        <p className="text-sm text-slate-500 mt-1">Visão global de todos os casos de teste — inicie, aprove ou reprove</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <GlassEffect
            key={status}
            variant="card"
            className="rounded-2xl w-full cursor-pointer"
            onClick={() => setStatusFilter(statusFilter === status ? '__all__' : status)}
          >
            <div className={`px-5 py-4 rounded-2xl border transition-all ${statusFilter === status ? cfg.bg : ''}`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{cfg.label}</p>
              <p className={`text-2xl font-bold font-mono ${cfg.color}`}>
                {loading ? '—' : (counts[status] ?? 0)}
              </p>
            </div>
          </GlassEffect>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por regra, responsável, protocolo…"
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white/[0.04] border border-white/[0.07] text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/40 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.07] text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
        >
          {STATUS_LIST.map(s => (
            <option key={s} value={s} className="bg-[#0D1321]">
              {s === '__all__' ? 'Todos os status' : s}
            </option>
          ))}
        </select>
        {statusFilter !== '__all__' && (
          <button
            onClick={() => setStatusFilter('__all__')}
            className="flex items-center gap-1 px-3 h-9 rounded-xl text-xs text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Limpar filtro
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando casos…
        </div>
      ) : casos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <FlaskConical className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-sm">Nenhum caso encontrado.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['SO', 'Regra', 'Responsável', 'Protocolo', 'Versão @BI', 'Qtd / Tam.', 'Status', 'Início', 'Fim', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {casos.map(caso => {
                  const cfg = STATUS_CFG[caso.status] ?? STATUS_CFG.Pendente
                  const isLinux = caso.tabela_origem === 'testes_linux'
                  const busy = actioning === caso.id

                  return (
                    <tr key={caso.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group">
                      {/* SO */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide',
                          isLinux ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                        )}>
                          {isLinux ? <Terminal className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                          {isLinux ? 'Linux' : 'Win'}
                        </span>
                      </td>
                      {/* Regra */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-[12px] font-medium text-slate-200 truncate" title={caso.nome_regra ?? ''}>
                          {caso.nome_regra ?? <span className="text-slate-600">id {caso.id_pk_regra}</span>}
                        </p>
                      </td>
                      {/* Responsável */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {caso.responsavel ?? <span className="text-slate-700">—</span>}
                      </td>
                      {/* Protocolo */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {caso.protocolo ?? <span className="text-slate-700">—</span>}
                      </td>
                      {/* Versão @BI */}
                      <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                        {caso.versao_bi ?? <span className="text-slate-700">—</span>}
                      </td>
                      {/* Qtd / Tam */}
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {caso.qtd_arquivos && <span>{caso.qtd_arquivos}</span>}
                        {caso.qtd_arquivos && caso.tamanho_arquivos && <span className="text-slate-700"> / </span>}
                        {caso.tamanho_arquivos && <span>{caso.tamanho_arquivos}</span>}
                        {!caso.qtd_arquivos && !caso.tamanho_arquivos && <span className="text-slate-700">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {caso.motivo_reprovacao && (
                          <p className="text-[10px] text-red-400/70 mt-0.5 max-w-[120px] truncate" title={caso.motivo_reprovacao}>
                            {caso.motivo_reprovacao}
                          </p>
                        )}
                      </td>
                      {/* Início */}
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {caso.data_inicio
                          ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(caso.data_inicio)}</span>
                          : <span className="text-slate-700">—</span>}
                      </td>
                      {/* Fim */}
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {caso.data_fim ? fmt(caso.data_fim) : <span className="text-slate-700">—</span>}
                      </td>
                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                          ) : (
                            <>
                              {caso.status === 'Pendente' && (
                                <ActionBtn title="Iniciar" color="text-amber-300" onClick={() => updateStatus(caso.id, 'Em Andamento')}>
                                  <Play className="w-3.5 h-3.5" />
                                </ActionBtn>
                              )}
                              {caso.status === 'Em Andamento' && (
                                <>
                                  <ActionBtn title="Aprovar" color="text-emerald-300" onClick={() => updateStatus(caso.id, 'Aprovado')}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </ActionBtn>
                                  <ActionBtn title="Reprovar" color="text-red-300" onClick={() => setMotivoTarget(caso.id)}>
                                    <XCircle className="w-3.5 h-3.5" />
                                  </ActionBtn>
                                </>
                              )}
                              {(caso.status === 'Aprovado' || caso.status === 'Reprovado') && (
                                <ActionBtn title="Resetar para Pendente" color="text-slate-400" onClick={() => updateStatus(caso.id, 'Pendente')}>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </ActionBtn>
                              )}
                              <ActionBtn title="Excluir" color="text-red-400/60 hover:text-red-400" onClick={() => handleDelete(caso.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </ActionBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="text-xs">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de{' '}
            <span className="font-mono font-semibold text-slate-300">{total}</span> casos
          </span>
          <div className="flex items-center gap-2">
            <PageBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </PageBtn>
            <span className="text-xs font-mono px-2">{page} / {totalPages}</span>
            <PageBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </PageBtn>
          </div>
        </div>
      )}

      {/* Modal motivo reprovação */}
      {motivoTarget !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMotivoTarget(null)} />
          <div className="relative z-10 w-full max-w-md">
            <GlassEffect variant="card" className="rounded-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h3 className="text-base font-semibold text-slate-200">Motivo da Reprovação</h3>
                  </div>
                  <GlassEffect variant="card" className="rounded-lg" onClick={() => setMotivoTarget(null)}>
                    <div className="p-1.5 text-slate-400"><X className="w-4 h-4" /></div>
                  </GlassEffect>
                </div>
                <MotivoForm
                  onConfirm={async (motivo) => {
                    const id = motivoTarget
                    setMotivoTarget(null)
                    await updateStatus(id, 'Reprovado', { motivo_reprovacao: motivo })
                  }}
                  onClose={() => setMotivoTarget(null)}
                />
              </div>
            </GlassEffect>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ title, onClick, color, children }: {
  title: string; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <GlassEffect variant="card" className="rounded-lg" onClick={onClick}>
      <div className={`p-2 ${color}`} title={title}>{children}</div>
    </GlassEffect>
  )
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
      {children}
    </button>
  )
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}
