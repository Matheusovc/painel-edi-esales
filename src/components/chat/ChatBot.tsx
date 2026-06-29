'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SiriWave } from '@/components/ui/siri-wave'
import {
  Search, X, Monitor, Terminal, Play, Clock, XCircle,
  Loader2, Zap, Sparkles, AlertTriangle, Send, Bot,
  CheckCircle, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Teste, ExecucaoRegra } from '@/types'

type Tab = 'search' | 'ai'
type ActionKey = `${'exec' | 'andamento' | 'reprovado'}:${string}`

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  rows?: Record<string, unknown>[]
  loading?: boolean
  error?: boolean
}

interface Summary {
  hoje: { testadas: number; aprovadas: number; reprovadas: number }
  gargalos: Array<{
    tabela_origem: string
    id_pk: number
    horas: number
    nome_da_regra: string
    executor_da_regra: string
  }>
  gargalo_threshold_horas: number
}

const AI_SUGGESTIONS = [
  'Quais regras Linux foram reprovadas esta semana?',
  'Quantas regras estão com criticidade Alta?',
  'Quais protocolos têm mais reprovações no total?',
  'Quais regras foram aprovadas no Windows este mês?',
]

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('search')

  // search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Teste[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeRules, setActiveRules] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<Set<ActionKey>>(new Set())
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // AI chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const aiRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // summary
  const [summary, setSummary] = useState<Summary | null>(null)
  const [gargaloDismissed, setGargaloDismissed] = useState(false)

  function execKey(r: Teste) {
    return `${r.tabela_origem ?? 'testes_windows'}:${r.id_pk}`
  }

  function setAction(key: ActionKey, v: boolean) {
    setActionLoading(prev => { const n = new Set(prev); v ? n.add(key) : n.delete(key); return n })
  }

  function showFeedback(key: string, msg: string) {
    setFeedback(p => ({ ...p, [key]: msg }))
    setTimeout(() => setFeedback(p => { const n = { ...p }; delete n[key]; return n }), 2000)
  }

  const loadActive = useCallback(() => {
    fetch('/api/execucao').then(r => r.json())
      .then((d: { data: ExecucaoRegra[] }) =>
        setActiveRules(new Set((d.data ?? []).map(r => `${r.tabela_origem}:${r.id_pk}`))))
      .catch(() => {})
  }, [])

  const loadSummary = useCallback(() => {
    fetch('/api/chat/summary').then(r => r.json())
      .then((d: Summary) => setSummary(d))
      .catch(() => {})
  }, [])

  useEffect(() => { loadActive(); loadSummary() }, [loadActive, loadSummary])

  useEffect(() => {
    if (!open) return
    loadSummary()
    setGargaloDismissed(false)
    setTimeout(() => (tab === 'search' ? searchRef : aiRef).current?.focus(), 60)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r = await fetch(`/api/testes?os=all&search=${encodeURIComponent(query)}&limit=6&page=1`)
        setResults((await r.json()).data ?? [])
      } catch { setResults([]) }
      finally { setSearchLoading(false) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function handleExec(row: Teste) {
    const tabela = row.tabela_origem ?? 'testes_windows'
    const key = execKey(row)
    const isActive = activeRules.has(key)
    const ak: ActionKey = `exec:${key}`
    setAction(ak, true)
    try {
      const r = await fetch('/api/execucao', {
        method: isActive ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela_origem: tabela, id_pk: row.id_pk }),
      })
      if (r.ok) {
        setActiveRules(prev => { const n = new Set(prev); isActive ? n.delete(key) : n.add(key); return n })
        showFeedback(key, isActive ? 'Removida da execução' : 'Em Execução ✓')
        loadSummary()
      }
    } catch { /* silent */ }
    finally { setAction(ak, false) }
  }

  async function handleStatus(row: Teste, resultado: string) {
    const tabela = row.tabela_origem ?? 'testes_windows'
    const os = tabela === 'testes_linux' ? 'linux' : 'windows'
    const key = execKey(row)
    const slug = resultado === 'Em Andamento' ? 'andamento' : 'reprovado'
    const ak: ActionKey = `${slug}:${key}`
    setAction(ak, true)
    try {
      const r = await fetch(`/api/testes/${row.id_pk}?os=${os}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado }),
      })
      if (r.ok) {
        setResults(prev => prev.map(r2 =>
          r2.id_pk === row.id_pk && r2.tabela_origem === row.tabela_origem
            ? { ...r2, resultado } : r2
        ))
        showFeedback(key, `${resultado} ✓`)
        loadSummary()
      }
    } catch { /* silent */ }
    finally { setAction(ak, false) }
  }

  async function sendAI() {
    const msg = aiInput.trim()
    if (!msg || aiLoading) return
    setAiInput('')
    const uid = Date.now().toString()
    const lid = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', content: msg },
      { id: lid, role: 'assistant', content: '', loading: true },
    ])
    setAiLoading(true)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const d = await r.json()
      setMessages(prev => prev.map(m =>
        m.id === lid
          ? { ...m, content: d.answer || 'Sem resposta.', rows: d.rows, loading: false, error: !!d.error }
          : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === lid
          ? { ...m, content: 'Erro de conexão. Tente novamente.', loading: false, error: true }
          : m
      ))
    } finally {
      setAiLoading(false)
    }
  }

  const gargaloCount = summary?.gargalos?.length ?? 0
  const threshold = summary?.gargalo_threshold_horas ?? 4

  return (
    <>
      {open && (
        <div className="fixed bottom-44 right-4 z-50 w-[400px] max-h-[600px] flex flex-col rounded-2xl bg-[rgba(8,12,20,0.96)] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
            <SiriWave variant="wave" size={72} renderScale={2} className="rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">EDI Assistant</p>
              <p className="text-[13px] text-slate-500">Busque e analise regras EDI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bar — hoje */}
          {summary && (
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <SummaryChip
                icon={<Activity className="w-3 h-3 text-blue-400" />}
                value={summary.hoje.testadas}
                label="testadas"
                color="text-blue-400"
              />
              <SummaryChip
                icon={<CheckCircle className="w-3 h-3 text-emerald-400" />}
                value={summary.hoje.aprovadas}
                label="aprovadas"
                color="text-emerald-400"
              />
              <SummaryChip
                icon={<XCircle className="w-3 h-3 text-red-400" />}
                value={summary.hoje.reprovadas}
                label="reprovadas"
                color="text-red-400"
              />
              <span className="ml-auto text-[12px] text-slate-600 shrink-0">hoje</span>
            </div>
          )}

          {/* Gargalo alert */}
          {gargaloCount > 0 && !gargaloDismissed && (
            <div className="mx-3 mt-2.5 shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[13px] font-semibold text-amber-300 flex-1">
                  {gargaloCount} regra{gargaloCount > 1 ? 's' : ''} em execução há +{threshold}h
                </span>
                <button
                  onClick={() => setGargaloDismissed(true)}
                  className="w-5 h-5 flex items-center justify-center rounded-md text-amber-400/60 hover:text-amber-200 hover:bg-amber-500/20 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {summary?.gargalos.slice(0, 3).map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={cn(
                      'text-[11px] font-bold px-1 py-0.5 rounded uppercase shrink-0',
                      g.tabela_origem === 'testes_linux'
                        ? 'bg-orange-500/10 text-orange-400'
                        : 'bg-blue-500/10 text-blue-400'
                    )}>
                      {g.tabela_origem === 'testes_linux' ? 'LNX' : 'WIN'}
                    </span>
                    <span className="text-[12px] text-slate-400 truncate flex-1">{g.nome_da_regra}</span>
                    <span className="text-[12px] font-mono text-amber-400 shrink-0">{g.horas}h</span>
                  </div>
                ))}
                {gargaloCount > 3 && (
                  <p className="text-[12px] text-amber-500/60 pt-0.5">+{gargaloCount - 3} mais</p>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
            {([
              ['search', <Search key="s" className="w-3 h-3" />, 'Buscar'],
              ['ai',     <Sparkles key="a" className="w-3 h-3" />, 'Assistente IA'],
            ] as const).map(([t, icon, label]) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setTimeout(() => (t === 'search' ? searchRef : aiRef).current?.focus(), 50)
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer',
                  tab === t
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                )}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ── BUSCAR ── */}
          {tab === 'search' && (
            <div className="flex flex-col flex-1 overflow-hidden mt-2.5">
              <div className="px-4 pb-3 shrink-0">
                <div className="relative">
                  {searchLoading
                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  }
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar por nome, ID, protocolo..."
                    className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 text-base focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
                {!query.trim() ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-600">
                    <Zap className="w-7 h-7 opacity-20" />
                    <p className="text-sm text-center">
                      Digite para buscar uma regra<br />e marcar atalhos rapidamente
                    </p>
                  </div>
                ) : results.length === 0 && !searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-600">
                    <Search className="w-6 h-6 opacity-20" />
                    <p className="text-sm">Nenhuma regra encontrada</p>
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
                          <div className="flex items-start gap-2 mb-2.5">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 mt-0.5',
                              isLinux
                                ? 'bg-orange-500/10 text-orange-400'
                                : 'bg-blue-500/10 text-blue-400'
                            )}>
                              {isLinux ? <Terminal className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                              {isLinux ? 'LNX' : 'WIN'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-slate-200 leading-tight line-clamp-2" title={row.nome_da_regra}>
                                {row.nome_da_regra}
                              </p>
                              {row.id && <span className="text-[12px] font-mono text-slate-600">{row.id}</span>}
                            </div>
                          </div>

                          {fb && (
                            <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] font-medium text-center">
                              {fb}
                            </div>
                          )}

                          <div className="flex gap-1.5">
                            <ActionBtn
                              active={isExec}
                              loading={actionLoading.has(`exec:${key}`)}
                              onClick={() => handleExec(row)}
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

          {/* ── ASSISTENTE IA ── */}
          {tab === 'ai' && (
            <div className="flex flex-col flex-1 overflow-hidden mt-2.5">
              <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2">
                {messages.length === 0 ? (
                  <div className="py-6 space-y-4">
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Bot className="w-8 h-8 opacity-20" />
                      <p className="text-sm text-center">
                        Faça perguntas sobre as regras EDI<br />em linguagem natural
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {AI_SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => { setAiInput(s); aiRef.current?.focus() }}
                          className="w-full text-left px-3 py-2 rounded-xl text-[13px] text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-200 transition-all cursor-pointer leading-snug"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                            <Bot className="w-3 h-3 text-blue-400" />
                          </div>
                        )}
                        <div className={cn(
                          'max-w-[84%] rounded-2xl px-3 py-2 text-[14px]',
                          msg.role === 'user'
                            ? 'bg-blue-600/30 text-blue-100 border border-blue-500/20'
                            : msg.error
                              ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                              : 'bg-white/[0.05] text-slate-200 border border-white/[0.08]'
                        )}>
                          {msg.loading ? (
                            <div className="flex items-center gap-2 text-slate-500 py-0.5">
                              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                              <span>Analisando...</span>
                            </div>
                          ) : (
                            <>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                              {msg.rows && msg.rows.length > 0 && (
                                <div className="mt-2.5 overflow-x-auto rounded-lg border border-white/[0.10]">
                                  <table className="text-[12px] min-w-full">
                                    <thead>
                                      <tr className="bg-white/[0.05]">
                                        {Object.keys(msg.rows[0]).map(col => (
                                          <th key={col} className="px-2 py-1.5 text-left text-slate-500 font-semibold whitespace-nowrap uppercase tracking-wide text-[11px]">
                                            {col}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {msg.rows.slice(0, 8).map((row, i) => (
                                        <tr key={i} className="border-t border-white/[0.05] hover:bg-white/[0.03]">
                                          {Object.values(row).map((val, j) => (
                                            <td key={j} className="px-2 py-1.5 text-slate-300 whitespace-nowrap max-w-[140px] truncate">
                                              {String(val ?? '—')}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {msg.rows.length > 8 && (
                                    <p className="text-[12px] text-slate-600 text-center py-1.5 border-t border-white/[0.05]">
                                      +{msg.rows.length - 8} resultados adicionais
                                    </p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-1 shrink-0 border-t border-white/[0.06]">
                <div className="flex gap-2 items-center mt-2">
                  <input
                    ref={aiRef}
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAI()}
                    placeholder="Faça uma pergunta sobre as regras..."
                    disabled={aiLoading}
                    className="flex-1 h-9 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={sendAI}
                    disabled={!aiInput.trim() || aiLoading}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {aiLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        {gargaloCount > 0 && !open && (
          <div className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/40 animate-pulse">
            {gargaloCount}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          title="EDI Assistant"
          className={cn(
            'w-36 h-36 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-2xl',
            open
              ? 'shadow-blue-500/50 ring-2 ring-blue-500/60 scale-95'
              : 'hover:scale-105 shadow-black/60 hover:shadow-blue-500/30'
          )}
        >
          <SiriWave variant="fluid-dots" size={144} renderScale={3} className="rounded-none" />
        </button>
      </div>
    </>
  )
}

function SummaryChip({ icon, value, label, color }: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={cn('text-[15px] font-bold font-mono leading-none', color)}>{value}</span>
      <span className="text-[12px] text-slate-600">{label}</span>
    </div>
  )
}

function ActionBtn({ active, loading, onClick, icon, label, activeClass, inactiveClass }: {
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
        'flex-1 flex items-center justify-center gap-1 h-7 rounded-lg text-[13px] font-medium border transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        active ? activeClass : inactiveClass
      )}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
      {label}
    </button>
  )
}
