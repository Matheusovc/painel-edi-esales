'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from './StatusBadge'
import { DeleteModal } from './DeleteModal'
import { EditResultadoModal } from './EditResultadoModal'
import { EditRegraModal } from './EditRegraModal'
import { HistoricoModal } from './HistoricoModal'
import { CasosTesteModal } from './CasosTesteModal'
import { NovaRegraModal } from './NovaRegraModal'
import {
  Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  Loader2, SlidersHorizontal, Edit3, Clock, FlaskConical, Monitor, Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Teste, Listas, ExecucaoRegra } from '@/types'

const RESULTADOS = ['Aprovado', 'Reprovado', 'Em Andamento', 'Aguardando Ação', 'Volumetria', 'Não Iniciado']

interface Props { os: 'windows' | 'linux' | 'all' }

export function TestesTable({ os }: Props) {
  const [rows, setRows] = useState<Teste[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [protocoloFilter, setProtocoloFilter] = useState('__all__')
  const [loading, setLoading] = useState(true)
  const [listas, setListas] = useState<Listas>({})
  const [activeRules, setActiveRules] = useState<Set<string>>(new Set())
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const [novaOpen, setNovaOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Teste | null>(null)
  const [editResultadoTarget, setEditResultadoTarget] = useState<Teste | null>(null)
  const [editRegraTarget, setEditRegraTarget] = useState<Teste | null>(null)
  const [historicoTarget, setHistoricoTarget] = useState<Teste | null>(null)
  const [casosTarget, setCasosTarget] = useState<Teste | null>(null)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  function activeKey(tabela: string, id_pk: number) {
    return `${tabela}:${id_pk}`
  }

  function loadActiveRules() {
    fetch('/api/execucao')
      .then((r) => r.json())
      .then((d: { data: ExecucaoRegra[] }) => {
        const keys = new Set((d.data ?? []).map((r) => activeKey(r.tabela_origem, r.id_pk)))
        setActiveRules(keys)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetch('/api/listas').then((r) => r.json()).then((d) => setListas(d.listas ?? {})).catch(() => {})
    loadActiveRules()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ os, page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter !== '__all__') params.set('status', statusFilter)
      if (protocoloFilter !== '__all__') params.set('protocolo', protocoloFilter)
      const res = await fetch(`/api/testes?${params}`)
      const json = await res.json()
      setRows(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch { setRows([]) }
    finally { setLoading(false) }
  }, [os, page, search, statusFilter, protocoloFilter])

  useEffect(() => { setPage(1) }, [os, search, statusFilter, protocoloFilter])
  useEffect(() => { fetchData() }, [fetchData])

  const protocolos = listas['protocolos'] ?? []

  function resolveTabela(row: Teste): 'testes_windows' | 'testes_linux' {
    if (row.tabela_origem) return row.tabela_origem
    return os === 'linux' ? 'testes_linux' : 'testes_windows'
  }

  function resolveOs(row: Teste): 'windows' | 'linux' {
    if (row.tabela_origem) return row.tabela_origem === 'testes_linux' ? 'linux' : 'windows'
    return os === 'linux' ? 'linux' : 'windows'
  }

  async function handleToggleExecucao(row: Teste) {
    const tabela = resolveTabela(row)
    const key = activeKey(tabela, row.id_pk)
    const isActive = activeRules.has(key)
    const checkKey = `${row.id_pk}`
    setCheckingId(checkKey)

    try {
      const res = await fetch('/api/execucao', {
        method: isActive ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela_origem: tabela, id_pk: row.id_pk }),
      })
      if (res.ok) {
        setActiveRules((prev) => {
          const next = new Set(prev)
          isActive ? next.delete(key) : next.add(key)
          return next
        })
        fetchData()
      }
    } catch { /* silent */ }
    finally { setCheckingId(null) }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all duration-200"
            placeholder="Buscar por nome, ID, executor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            className="h-9 pl-9 pr-8 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="__all__" className="bg-white dark:bg-[#0D1321]">Todos os status</option>
            {RESULTADOS.map((r) => <option key={r} value={r} className="bg-white dark:bg-[#0D1321]">{r}</option>)}
          </select>
        </div>

        {protocolos.length > 0 && (
          <select
            className="h-9 px-3 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
            value={protocoloFilter}
            onChange={(e) => setProtocoloFilter(e.target.value)}
          >
            <option value="__all__" className="bg-white dark:bg-[#0D1321]">Protocolo</option>
            {protocolos.map((p) => <option key={p} value={p} className="bg-white dark:bg-[#0D1321]">{p}</option>)}
          </select>
        )}

        <button
          onClick={() => setNovaOpen(true)}
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-200 cursor-pointer shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Regra
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[rgba(8,12,20,0.88)] backdrop-blur-sm border border-white/[0.12] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm">Carregando regras...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Search className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhuma regra encontrada</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
                  {['Iniciar', os === 'all' ? 'SO' : null, 'ID', 'Nome da Regra', 'Protocolo', 'Tipo', 'Executor', 'Status', 'Versão', ''].filter(Boolean).map((h) => (
                    <th key={h as string} className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const tabela = resolveTabela(row)
                  const rowKey = `${tabela}:${row.id_pk}`
                  const key = activeKey(tabela, row.id_pk)
                  const isActive = activeRules.has(key)
                  const isChecking = checkingId === String(row.id_pk)
                  const isLinux = tabela === 'testes_linux'

                  return (
                    <tr
                      key={rowKey}
                      className={cn(
                        'border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150 group',
                        i % 2 === 1 && 'bg-slate-50/60 dark:bg-white/[0.015]',
                        isActive && 'bg-blue-50/50 dark:bg-blue-500/[0.05]'
                      )}
                    >
                      {/* Iniciar checkbox */}
                      <td className="px-3 py-3">
                        <label className="flex items-center gap-1.5 cursor-pointer group/check">
                          {isChecking ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleToggleExecucao(row)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-blue-500"
                            />
                          )}
                        </label>
                      </td>

                      {/* SO column (only in Todos mode) */}
                      {os === 'all' && (
                        <td className="px-3 py-3">
                          <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide', isLinux ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400')}>
                            {isLinux ? <Terminal className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                            {isLinux ? 'Linux' : 'Win'}
                          </span>
                        </td>
                      )}

                      <td className="px-3 py-3">
                        <span className="text-[11px] font-mono text-slate-400">{row.id ?? '—'}</span>
                      </td>

                      <td className="px-3 py-3 max-w-[260px]">
                        <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200 truncate" title={row.nome_da_regra}>
                          {row.nome_da_regra}
                        </p>
                        {row.observacoes && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5" title={row.observacoes}>
                            {row.observacoes}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-[11px] text-slate-500">{row.protocolo_parceiro || '—'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-slate-400">{row.tipo_de_regra || '—'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-slate-500 font-mono">{row.executor_da_regra || '—'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.resultado} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-mono text-slate-400">{row.versao_do_edie || '—'}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <ActionBtn title="Editar resultado" onClick={() => setEditResultadoTarget(row)} icon={<Pencil className="w-3.5 h-3.5" />} color="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10" />
                          <ActionBtn title="Editar regra completa" onClick={() => setEditRegraTarget(row)} icon={<Edit3 className="w-3.5 h-3.5" />} color="hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10" />
                          <ActionBtn title="Casos de Teste" onClick={() => setCasosTarget(row)} icon={<FlaskConical className="w-3.5 h-3.5" />} color="hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10" />
                          <ActionBtn title="Histórico" onClick={() => setHistoricoTarget(row)} icon={<Clock className="w-3.5 h-3.5" />} color="hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10" />
                          <ActionBtn title="Excluir" onClick={() => setDeleteTarget(row)} icon={<Trash2 className="w-3.5 h-3.5" />} color="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="text-[12px]">
            {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de{' '}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{total.toLocaleString('pt-BR')}</span> regras
          </span>
          <div className="flex items-center gap-2">
            <PagBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft className="w-4 h-4" />} />
            <span className="text-[12px] font-mono px-2 text-slate-500">{page} / {totalPages}</span>
            <PagBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} icon={<ChevronRight className="w-4 h-4" />} />
          </div>
        </div>
      )}

      {/* Modals */}
      <NovaRegraModal
        open={novaOpen} onClose={() => setNovaOpen(false)} onCreated={fetchData}
        defaultOs={os === 'all' ? 'windows' : os}
      />

      {editResultadoTarget && (
        <EditResultadoModal
          open onClose={() => setEditResultadoTarget(null)} onUpdated={fetchData}
          idPk={editResultadoTarget.id_pk}
          nomeDaRegra={editResultadoTarget.nome_da_regra}
          resultadoAtual={editResultadoTarget.resultado}
          os={resolveOs(editResultadoTarget)}
        />
      )}

      {editRegraTarget && (
        <EditRegraModal
          open onClose={() => setEditRegraTarget(null)} onUpdated={fetchData}
          regra={editRegraTarget}
          os={resolveOs(editRegraTarget)}
        />
      )}

      {historicoTarget && (
        <HistoricoModal
          open onClose={() => setHistoricoTarget(null)}
          idPk={historicoTarget.id_pk}
          nomeDaRegra={historicoTarget.nome_da_regra}
          tabelaOrigem={resolveTabela(historicoTarget)}
        />
      )}

      {casosTarget && (
        <CasosTesteModal
          open onClose={() => setCasosTarget(null)}
          idPk={casosTarget.id_pk}
          nomeDaRegra={casosTarget.nome_da_regra}
          tabelaOrigem={resolveTabela(casosTarget)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          open onClose={() => setDeleteTarget(null)} onDeleted={fetchData}
          idPk={deleteTarget.id_pk}
          nomeDaRegra={deleteTarget.nome_da_regra}
          os={resolveOs(deleteTarget)}
        />
      )}
    </div>
  )
}

function ActionBtn({ title, onClick, icon, color }: {
  title: string
  onClick: () => void
  icon: React.ReactNode
  color: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 transition-all duration-150 cursor-pointer',
        color
      )}
    >
      {icon}
    </button>
  )
}

function PagBtn({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
    >
      {icon}
    </button>
  )
}
