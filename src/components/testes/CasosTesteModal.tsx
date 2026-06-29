'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Play, CheckCircle2, XCircle, Square, Trash2, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CasoTeste, Listas } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  idPk: number
  nomeDaRegra: string
  tabelaOrigem: string
}

const STATUS_CONFIG_CT: Record<string, { label: string; color: string }> = {
  Pendente:      { label: 'Pendente',      color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'Em Andamento':{ label: 'Em Andamento',  color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  Aprovado:      { label: 'Aprovado',      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  Reprovado:     { label: 'Reprovado',     color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const EMPTY_FORM = {
  responsavel: '', versao_bi: '', protocolo: '',
  qtd_arquivos: '', tamanho_arquivos: '', observacoes: '',
}

export function CasosTesteModal({ open, onClose, idPk, nomeDaRegra, tabelaOrigem }: Props) {
  const [casos, setCasos] = useState<CasoTeste[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [listas, setListas] = useState<Listas>({})
  const [motivoModal, setMotivoModal] = useState<number | null>(null)
  const [motivo, setMotivo] = useState('')

  function fetchCasos() {
    setLoading(true)
    fetch(`/api/casos-teste?tabela=${tabelaOrigem}&id_pk=${idPk}`)
      .then((r) => r.json())
      .then((d) => setCasos(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open) return
    fetchCasos()
    fetch('/api/listas').then((r) => r.json()).then((d) => setListas(d.listas ?? {})).catch(() => {})
  }, [open, idPk, tabelaOrigem])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/casos-teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tabela_origem: tabelaOrigem, id_pk_regra: idPk }),
      })
      if (!res.ok) { toast.error('Erro ao criar caso.'); return }
      toast.success('Caso de teste criado!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchCasos()
    } catch { toast.error('Falha de conexão.') }
    finally { setSaving(false) }
  }

  async function updateStatus(id: number, status: string, extra?: Record<string, string>) {
    const body: Record<string, string> = { status, ...extra }
    if (status === 'Em Andamento') body.data_inicio = new Date().toISOString().slice(0, 19).replace('T', ' ')
    if (status === 'Aprovado' || status === 'Reprovado') body.data_fim = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const res = await fetch(`/api/casos-teste/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error('Erro ao atualizar status.'); return }
    fetchCasos()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/casos-teste/${id}`, { method: 'DELETE' })
    fetchCasos()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              Casos de Teste
            </DialogTitle>
            <p className="text-xs text-muted-foreground truncate">{nomeDaRegra}</p>
          </DialogHeader>

          {/* New case form */}
          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Novo Caso de Teste</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Responsável">
                  <SelectOrInput value={form.responsavel} onChange={(v) => setForm(p => ({...p, responsavel: v}))} options={listas['executores'] ?? []} placeholder="Responsável" />
                </Field>
                <Field label="Versão @BI">
                  <Input value={form.versao_bi} onChange={(e) => setForm(p => ({...p, versao_bi: e.target.value}))} placeholder="Ex: V_5.1" />
                </Field>
                <Field label="Protocolo">
                  <SelectOrInput value={form.protocolo} onChange={(v) => setForm(p => ({...p, protocolo: v}))} options={listas['protocolos'] ?? []} placeholder="FTP, SFTP..." />
                </Field>
                <Field label="Qtd. Arquivos">
                  <Input value={form.qtd_arquivos} onChange={(e) => setForm(p => ({...p, qtd_arquivos: e.target.value}))} placeholder="Ex: 100, 5000" />
                </Field>
                <Field label="Tamanho dos Arquivos">
                  <Input value={form.tamanho_arquivos} onChange={(e) => setForm(p => ({...p, tamanho_arquivos: e.target.value}))} placeholder="Ex: 1 MB, 1 GB" />
                </Field>
              </div>
              <Field label="Observações">
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[60px]"
                  value={form.observacoes} onChange={(e) => setForm(p => ({...p, observacoes: e.target.value}))}
                />
              </Field>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar Caso'}
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Caso de Teste
            </Button>
          )}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
          ) : casos.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400 dark:text-slate-600 gap-2">
              <FlaskConical className="w-8 h-8 opacity-20" />
              <p className="text-sm">Nenhum caso de teste registrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {casos.map((caso) => {
                const cfg = STATUS_CONFIG_CT[caso.status] ?? STATUS_CONFIG_CT['Pendente']
                return (
                  <div key={caso.id} className="rounded-xl border border-slate-200 dark:border-white/[0.07] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={cn('inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span>
                        {caso.responsavel && <span className="ml-2 text-[11px] text-slate-500">👤 {caso.responsavel}</span>}
                      </div>
                      <button onClick={() => handleDelete(caso.id)} className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {caso.protocolo && <span>Protocolo: <strong>{caso.protocolo}</strong></span>}
                      {caso.versao_bi && <span>Versão @BI: <strong>{caso.versao_bi}</strong></span>}
                      {caso.qtd_arquivos && <span>Qtd: <strong>{caso.qtd_arquivos}</strong></span>}
                      {caso.tamanho_arquivos && <span>Tamanho: <strong>{caso.tamanho_arquivos}</strong></span>}
                      {caso.data_inicio && <span>Início: <strong>{new Date(caso.data_inicio).toLocaleString('pt-BR')}</strong></span>}
                      {caso.data_fim && <span>Fim: <strong>{new Date(caso.data_fim).toLocaleString('pt-BR')}</strong></span>}
                    </div>

                    {caso.observacoes && <p className="text-[11px] text-slate-500 italic">{caso.observacoes}</p>}
                    {caso.motivo_reprovacao && <p className="text-[11px] text-red-500">Motivo: {caso.motivo_reprovacao}</p>}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {caso.status === 'Pendente' && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => updateStatus(caso.id, 'Em Andamento')}>
                          <Play className="w-3 h-3 mr-1" /> Iniciar
                        </Button>
                      )}
                      {caso.status === 'Em Andamento' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400" onClick={() => updateStatus(caso.id, 'Aprovado')}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400" onClick={() => setMotivoModal(caso.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Reprovar
                          </Button>
                        </>
                      )}
                      {(caso.status === 'Aprovado' || caso.status === 'Reprovado') && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => updateStatus(caso.id, 'Pendente')}>
                          <Square className="w-3 h-3 mr-1" /> Resetar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reprovação motivo dialog */}
      <Dialog open={motivoModal !== null} onOpenChange={(v) => !v && setMotivoModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Motivo da Reprovação</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Descreva o motivo</Label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[80px]"
              value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o problema encontrado..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMotivoModal(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (motivoModal) {
                await updateStatus(motivoModal, 'Reprovado', { motivo_reprovacao: motivo })
                setMotivoModal(null)
                setMotivo('')
              }
            }}>Confirmar Reprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-[11px]">{label}</Label>{children}</div>
}

function SelectOrInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  if (options.length > 0) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    )
  }
  return <Input className="h-8 text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}
