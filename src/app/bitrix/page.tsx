'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import {
  Layers, CheckCircle2, XCircle, Loader2, Plus, RefreshCw,
  ExternalLink, MessageSquarePlus, X, AlertTriangle, ChevronDown,
} from 'lucide-react'
import { GlassEffect } from '@/components/ui/liquid-glass'

interface BitrixCard {
  id: number
  tabela_origem: string
  id_pk_regra: number
  deal_id: number
  titulo: string
  status: 'aberto' | 'fechado'
  criado_em: string
  atualizado_em: string
  nome_regra: string | null
  resultado: string | null
}

interface Category {
  ID: string
  NAME: string
}

type Tab = 'cards' | 'novo'

const STATUS_COLOR: Record<string, string> = {
  Aprovado: 'text-emerald-400 bg-emerald-500/10',
  Reprovado: 'text-red-400 bg-red-500/10',
  'Em Andamento': 'text-amber-400 bg-amber-500/10',
  'Não Iniciado': 'text-slate-400 bg-slate-500/10',
  Aguardando: 'text-blue-400 bg-blue-500/10',
}

/* ─── Form isolado — não re-renderiza o resto da página ao digitar ─── */
const CreateCardForm = memo(function CreateCardForm({
  categories,
  connectionOk,
  connectionLoading,
  onCreated,
}: {
  categories: Category[]
  connectionOk: boolean | null
  connectionLoading: boolean
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    tabela_origem: 'testes_linux',
    id_pk_regra: '',
    titulo: '',
    categoryId: '',
    stageId: '',
    comment: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.id_pk_regra || !form.categoryId) {
      setError('Preencha: ID da regra, título e categoria.')
      return
    }
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/bitrix/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabela_origem: form.tabela_origem,
          id_pk_regra: Number(form.id_pk_regra),
          titulo: form.titulo.trim(),
          categoryId: Number(form.categoryId),
          stageId: form.stageId.trim() || undefined,
          comment: form.comment.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Erro desconhecido')
      setSuccess(`Card criado! Deal ID: ${data.deal_id}`)
      setForm(f => ({ ...f, id_pk_regra: '', titulo: '', stageId: '', comment: '' }))
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-200">Criar novo card no Bitrix24</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <Field label="Origem da regra">
            <div className="relative">
              <select
                value={form.tabela_origem}
                onChange={e => setForm(f => ({ ...f, tabela_origem: e.target.value }))}
                className="w-full appearance-none bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60 cursor-pointer pr-9"
              >
                <option value="testes_linux">Linux</option>
                <option value="testes_windows">Windows</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </Field>

          <Field label="ID da regra (id_pk)">
            <input
              type="number"
              min={1}
              value={form.id_pk_regra}
              onChange={e => setForm(f => ({ ...f, id_pk_regra: e.target.value }))}
              placeholder="Ex: 42"
              className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60"
            />
          </Field>

          <Field label="Título do card">
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: [EDI] Regra TOTVS - Revisão Q3"
              className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60"
            />
          </Field>

          <Field label="Categoria Bitrix">
            {categories.length > 0 ? (
              <div className="relative">
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full appearance-none bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60 cursor-pointer pr-9"
                >
                  <option value="">Selecione…</option>
                  {categories.map(c => (
                    <option key={c.ID} value={c.ID}>{c.NAME}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            ) : (
              <input
                type="number"
                min={0}
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                placeholder="ID numérico da categoria"
                className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60"
              />
            )}
          </Field>

          <Field label="Stage ID (opcional)">
            <input
              type="text"
              value={form.stageId}
              onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
              placeholder="Ex: C4:NEW"
              className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60"
            />
          </Field>

          <Field label="Comentário inicial (opcional)">
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              rows={3}
              placeholder="Descreva o contexto do card…"
              className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none"
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-sm text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <GlassEffect variant="nav" className="rounded-xl w-full" disabled={creating || !connectionOk}>
            <button
              type="submit"
              disabled={creating || !connectionOk}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Criando…' : 'Criar Card'}
            </button>
          </GlassEffect>

          {!connectionOk && !connectionLoading && (
            <p className="text-xs text-amber-400/70 text-center">
              Bitrix24 desconectado — configure o webhook para criar cards
            </p>
          )}
        </form>
      </div>
    </div>
  )
})

/* ─── Página principal ─── */
export default function BitrixPage() {
  const [tab, setTab] = useState<Tab>('cards')
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)
  const [connectionMsg, setConnectionMsg] = useState('')
  const [connectionLoading, setConnectionLoading] = useState(true)
  const [cards, setCards] = useState<BitrixCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  const [commentModal, setCommentModal] = useState<{ card: BitrixCard } | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [closeTarget, setCloseTarget] = useState<BitrixCard | null>(null)
  const [closeSending, setCloseSending] = useState(false)

  const checkConnection = useCallback(async () => {
    setConnectionLoading(true)
    try {
      const res = await fetch('/api/bitrix/test')
      const data = await res.json()
      if (data.ok) {
        setConnectionOk(true)
        setConnectionMsg(`Conectado como: ${data.profile?.NAME ?? 'Desconhecido'}`)
      } else {
        setConnectionOk(false)
        setConnectionMsg(data.error ?? 'Falha na conexão')
      }
    } catch {
      setConnectionOk(false)
      setConnectionMsg('Erro de rede ao testar conexão')
    } finally {
      setConnectionLoading(false)
    }
  }, [])

  const loadCards = useCallback(async () => {
    setCardsLoading(true)
    try {
      const res = await fetch('/api/bitrix/cards')
      const data = await res.json()
      setCards(data.cards ?? [])
    } catch {
      setCards([])
    } finally {
      setCardsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/bitrix/categories')
      const data = await res.json()
      if (data.items) setCategories(data.items)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    checkConnection()
    loadCards()
    loadCategories()
  }, [checkConnection, loadCards, loadCategories])

  async function sendComment() {
    if (!commentModal || !commentText.trim()) return
    setCommentSending(true)
    try {
      await fetch(`/api/bitrix/cards/${commentModal.card.deal_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim() }),
      })
      setCommentModal(null)
      setCommentText('')
    } finally {
      setCommentSending(false)
    }
  }

  async function handleClose() {
    if (!closeTarget) return
    setCloseSending(true)
    try {
      await fetch(`/api/bitrix/cards/${closeTarget.deal_id}`, { method: 'DELETE' })
      setCloseTarget(null)
      loadCards()
    } finally {
      setCloseSending(false)
    }
  }

  const openCards = cards.filter(c => c.status === 'aberto')
  const closedCards = cards.filter(c => c.status === 'fechado')

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest">CRM</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Bitrix24
            </h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie cards de negócio vinculados às regras EDI</p>
          </div>
          <GlassEffect variant="nav" className="rounded-xl" onClick={() => { checkConnection(); loadCards() }}>
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-200">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </div>
          </GlassEffect>
        </div>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium ${
        connectionLoading
          ? 'border-white/[0.08] bg-white/[0.02] text-slate-500'
          : connectionOk
            ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300'
            : 'border-red-500/20 bg-red-500/[0.06] text-red-300'
      }`}>
        {connectionLoading
          ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          : connectionOk
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
        <span>{connectionLoading ? 'Verificando conexão com Bitrix24…' : connectionMsg}</span>
        {!connectionLoading && !connectionOk && (
          <span className="ml-auto text-xs text-red-400/70">
            Verifique BITRIX_WEBHOOK_URL no .env e regenere o webhook no painel Bitrix24
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['cards', 'Cards Existentes'], ['novo', 'Novo Card']] as [Tab, string][]).map(([key, label]) => (
          <GlassEffect
            key={key}
            variant={tab === key ? 'nav' : 'card'}
            className="rounded-xl"
            onClick={() => setTab(key)}
          >
            <div className={`px-5 py-2.5 text-sm font-semibold ${tab === key ? 'text-blue-200' : 'text-slate-400'}`}>
              {label}
            </div>
          </GlassEffect>
        ))}
      </div>

      {/* TAB: Cards existentes */}
      {tab === 'cards' && (
        <div className="space-y-4">
          {cardsLoading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando cards…
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600">
              <Layers className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm mb-5">Nenhum card criado ainda.</p>
              <GlassEffect variant="nav" className="rounded-xl" onClick={() => setTab('novo')}>
                <div className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-200">
                  <Plus className="w-4 h-4" />
                  Criar primeiro card
                </div>
              </GlassEffect>
            </div>
          ) : (
            <>
              {openCards.length > 0 && (
                <Section title="Abertos" count={openCards.length}>
                  <CardsTable
                    cards={openCards}
                    onComment={c => { setCommentModal({ card: c }); setCommentText('') }}
                    onClose={c => setCloseTarget(c)}
                  />
                </Section>
              )}
              {closedCards.length > 0 && (
                <Section title="Fechados" count={closedCards.length} muted>
                  <CardsTable cards={closedCards} closed />
                </Section>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB: Novo card — componente isolado, re-renders não afetam o resto */}
      {tab === 'novo' && (
        <CreateCardForm
          categories={categories}
          connectionOk={connectionOk}
          connectionLoading={connectionLoading}
          onCreated={() => { loadCards(); setTab('cards') }}
        />
      )}

      {/* Comment Modal */}
      {commentModal && (
        <Modal onClose={() => setCommentModal(null)} title="Adicionar comentário">
          <p className="text-xs text-slate-500 mb-3">
            Deal #{commentModal.card.deal_id} — {commentModal.card.titulo}
          </p>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Digite o comentário…"
            className="w-full bg-slate-800/70 border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none"
          />
          <div className="flex gap-3 mt-4">
            <GlassEffect variant="card" className="rounded-xl flex-1" onClick={() => setCommentModal(null)}>
              <div className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-300">
                Cancelar
              </div>
            </GlassEffect>
            <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={commentSending || !commentText.trim()}>
              <button
                onClick={sendComment}
                disabled={commentSending || !commentText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {commentSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                Enviar
              </button>
            </GlassEffect>
          </div>
        </Modal>
      )}

      {/* Close Confirm Modal */}
      {closeTarget && (
        <Modal onClose={() => setCloseTarget(null)} title="Fechar card">
          <p className="text-sm text-slate-400 mb-2">
            Tem certeza que deseja marcar o deal{' '}
            <span className="text-white font-semibold">#{closeTarget.deal_id}</span> como fechado?
          </p>
          <p className="text-xs text-slate-600 mb-5">{closeTarget.titulo}</p>
          <div className="flex gap-3">
            <GlassEffect variant="card" className="rounded-xl flex-1" onClick={() => setCloseTarget(null)}>
              <div className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-300">
                Cancelar
              </div>
            </GlassEffect>
            <GlassEffect variant="nav" className="rounded-xl flex-1" disabled={closeSending}>
              <button
                onClick={handleClose}
                disabled={closeSending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-300 bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {closeSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Fechar deal
              </button>
            </GlassEffect>
          </div>
        </Modal>
      )}

    </div>
  )
}

function Section({ title, count, children, muted }: {
  title: string; count: number; children: React.ReactNode; muted?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold uppercase tracking-widest ${muted ? 'text-slate-600' : 'text-slate-400'}`}>
          {title}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${muted ? 'text-slate-600 bg-white/[0.03]' : 'text-blue-300 bg-blue-500/10'}`}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

function CardsTable({ cards, onComment, onClose, closed }: {
  cards: BitrixCard[]
  onComment?: (c: BitrixCard) => void
  onClose?: (c: BitrixCard) => void
  closed?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Deal ID', 'Regra', 'Título', 'Resultado', 'Origem', 'Criado em', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id} className={`border-b border-white/[0.04] last:border-0 ${closed ? 'opacity-50' : 'hover:bg-white/[0.02]'} transition-colors`}>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    #{card.deal_id}
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {card.nome_regra
                    ? <span title={card.nome_regra} className="block max-w-[180px] truncate">{card.nome_regra}</span>
                    : <span className="text-slate-600">id_pk {card.id_pk_regra}</span>}
                </td>
                <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate" title={card.titulo}>{card.titulo}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {card.resultado
                    ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[card.resultado] ?? 'text-slate-400 bg-white/[0.04]'}`}>{card.resultado}</span>
                    : <span className="text-slate-600 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {card.tabela_origem === 'testes_linux' ? 'Linux' : 'Windows'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                  {new Date(card.criado_em).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  {!closed && (
                    <div className="flex items-center gap-2">
                      <GlassEffect variant="card" className="rounded-lg" onClick={() => onComment?.(card)}>
                        <div className="p-2 text-blue-300" title="Adicionar comentário">
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </div>
                      </GlassEffect>
                      <GlassEffect variant="card" className="rounded-lg" onClick={() => onClose?.(card)}>
                        <div className="p-2 text-red-300" title="Fechar card">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                      </GlassEffect>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
