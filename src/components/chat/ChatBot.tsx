'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SiriWave } from '@/components/ui/siri-wave'
import { Search, X, Monitor, Terminal, Play, Clock, XCircle, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Teste, ExecucaoRegra } from '@/types'

type ActionKey = `${'exec' | 'andamento' | 'reprovado'}:${string}`

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Teste[]>([])
  const [loading, setLoading] = useState(false)
  const [activeRules, setActiveRules] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<Set<ActionKey>>(new Set())
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function execKey(row: Teste) {
    const t = row.tabela_origem ?? 'testes_windows'
    return `${t}:${row.id_pk}`
  }

  function setAction(key: ActionKey, loading: boolean) {
    setActionLoading(prev => {
      const next = new Set(prev)
      loading ? next.add(key) : next.delete(key)
      return next
    })
  }

  function showFeedback(rowKey: string, msg: string) {
    setFeedback(prev => ({ ...prev, [rowKey]: msg }))
    setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[rowKey]; return n }), 2000)
  }

  const loadActiveRules = useCallback(() => {
    fetch('/api/execucao')
      .then(r => r.json())
      .then((d: { data: ExecucaoRegra[] }) => {
        const keys = new Set((d.data ?? []).map(r => `${r.tabela_origem}:${r.id_pk}`))
        setActiveRules(keys)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { loadActiveRules() }, [loadActiveRules])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/testes?os=all&search=${encodeURIComponent(query)}&limit=6&page=1`)
        const json = await res.json()
        setResults(json.data ?? [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function handleExecucao(row: Teste) {
    const tabela = row.tabela_origem ?? 'testes_windows'
    const key = execKey(row)
    const isActive = activeRules.has(key)
    const actionK: ActionKey = `exec:${key}`
    setAction(actionK, true)
    try {
      const res = await fetch('/api/execucao', {
        method: isActive ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela_origem: tabela, id_pk: row.id_pk }),
      })
      if (res.ok) {
        setActiveRules(prev => {
          const next = new Set(prev)
          isActive ? next.delete(key) : next.add(key)
          return next
        })
        showFeedback(key, isActive ? 'Removida da execução' : 'Em Execução ✓')
      }
    } catch { /* silent */ }
    finally { setAction(actionK, false) }
  }

  async function handleStatus(row: Teste, resultado: string) {
    const tabela = row.tabela_origem ?? 'testes_windows'
    const os = tabela === 'testes_linux' ? 'linux' : 'windows'
    const key = execKey(row)
    const slug = resultado === 'Em Andamento' ? 'andamento' : 'reprovado'
    const actionK: ActionKey = `${slug}:${key}`
    setAction(actionK, true)
    try {
      const res = await fetch(`/api/testes/${row.id_pk}?os=${os}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado }),
      })
      if (res.ok) {
        setResults(prev => prev.map(r => r.id_pk === row.id_pk && r.tabela_origem === row.tabela_origem
          ? { ...r, resultado } : r))
        showFeedback(key, `${resultado} ✓`)
      }
    } catch { /* silent */ }
    finally { setAction(actionK, false) }
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-[380px] max-h-[540px] flex flex-col rounded-2xl bg-[rgba(8,12,20,0.94)] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
            <SiriWave variant="wave" size={72} renderScale={2} className="rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">EDI Assistant</p>
              <p className="text-[11px] text-slate-500">Busque e gerencie regras rapidamente</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              {loading
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nome, ID, protocolo..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-600">
                <Zap className="w-7 h-7 opacity-20" />
                <p className="text-xs text-center">Digite para buscar uma regra e<br/>marcar atalhos rapidamente</p>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-600">
                <Search className="w-6 h-6 opacity-20" />
                <p className="text-xs">Nenhuma regra encontrada</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {results.map(row => {
                  const isLinux = row.tabela_origem === 'testes_linux'
                  const key = execKey(row)
                  const isExec = activeRules.has(key)
                  const fb = feedback[key]

                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-xl p-3 border transition-all duration-150',
                        isExec
                          ? 'bg-blue-500/[0.08] border-blue-500/20'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                      )}
                    >
                      {/* Rule info */}
                      <div className="flex items-start gap-2 mb-2.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 mt-0.5',
                          isLinux
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-blue-500/10 text-blue-400'
                        )}>
                          {isLinux ? <Terminal className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                          {isLinux ? 'LNX' : 'WIN'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-slate-200 leading-tight line-clamp-2" title={row.nome_da_regra}>
                            {row.nome_da_regra}
                          </p>
                          {row.id && (
                            <span className="text-[10px] font-mono text-slate-600">{row.id}</span>
                          )}
                        </div>
                      </div>

                      {/* Feedback toast */}
                      {fb && (
                        <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium text-center">
                          {fb}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1.5">
                        <ActionBtn
                          active={isExec}
                          loading={actionLoading.has(`exec:${key}`)}
                          onClick={() => handleExecucao(row)}
                          icon={<Play className="w-3 h-3" />}
                          label={isExec ? 'Em Exec.' : 'Iniciar'}
                          activeClass="bg-blue-500/20 text-blue-300 border-blue-500/30"
                          inactiveClass="text-slate-400 border-white/[0.08] hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20"
                        />
                        <ActionBtn
                          active={row.resultado === 'Em Andamento'}
                          loading={actionLoading.has(`andamento:${key}`)}
                          onClick={() => handleStatus(row, 'Em Andamento')}
                          icon={<Clock className="w-3 h-3" />}
                          label="Andamento"
                          activeClass="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          inactiveClass="text-slate-400 border-white/[0.08] hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20"
                        />
                        <ActionBtn
                          active={row.resultado === 'Reprovado'}
                          loading={actionLoading.has(`reprovado:${key}`)}
                          onClick={() => handleStatus(row, 'Reprovado')}
                          icon={<XCircle className="w-3 h-3" />}
                          label="Reprovar"
                          activeClass="bg-red-500/20 text-red-300 border-red-500/30"
                          inactiveClass="text-slate-400 border-white/[0.08] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="EDI Assistant"
        className={cn(
          'fixed bottom-4 right-4 z-50 w-36 h-36 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-2xl',
          open
            ? 'shadow-blue-500/50 ring-2 ring-blue-500/60 scale-95'
            : 'hover:scale-105 shadow-black/60 hover:shadow-blue-500/30'
        )}
      >
        <SiriWave variant="fluid-dots" size={144} renderScale={3} className="rounded-none" />
      </button>
    </>
  )
}

function ActionBtn({
  active, loading, onClick, icon, label, activeClass, inactiveClass,
}: {
  active: boolean
  loading: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  activeClass: string
  inactiveClass: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex-1 flex items-center justify-center gap-1 h-7 rounded-lg text-[11px] font-medium border transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        active ? activeClass : inactiveClass
      )}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
      {label}
    </button>
  )
}
