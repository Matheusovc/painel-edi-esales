'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Teste, Listas } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onUpdated: () => void
  regra: Teste
  os: 'windows' | 'linux'
}

const STATIC_RESULTADOS = [
  'Aprovado', 'Reprovado', 'Em Andamento', 'Aguardando Ação', 'Volumetria', 'Não Iniciado',
]

export function EditRegraModal({ open, onClose, onUpdated, regra, os }: Props) {
  const [form, setForm] = useState({ ...regra })
  const [listas, setListas] = useState<Listas>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...regra })
      fetch('/api/listas').then((r) => r.json()).then((d) => setListas(d.listas ?? {})).catch(() => {})
    }
  }, [open, regra])

  function set(key: keyof Teste, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome_da_regra?.trim()) {
      toast.error('O campo "Nome da regra" é obrigatório.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/testes/${regra.id_pk}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, os }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Erro ao salvar.'); return }
      toast.success('Regra atualizada!')
      onUpdated()
      onClose()
    } catch {
      toast.error('Falha de conexão.')
    } finally {
      setSaving(false)
    }
  }

  const opts = (cat: string) => listas[cat] ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Regra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID">
              <Input type="number" value={form.id ?? ''} onChange={(e) => set('id', e.target.value)} placeholder="Ex: 1" />
            </Field>
            <Field label="Nome da Regra *">
              <Input value={form.nome_da_regra || ''} onChange={(e) => set('nome_da_regra', e.target.value)} required />
            </Field>
            <Field label="Configuração da Regra">
              <Input value={form.configuracao_da_regra || ''} onChange={(e) => set('configuracao_da_regra', e.target.value)} />
            </Field>
            <Field label="Executor da Regra">
              <SelectOrInput value={form.executor_da_regra || ''} onChange={(v) => set('executor_da_regra', v)} options={opts('executores')} placeholder="Selecionar executor" />
            </Field>
            <Field label="Tipo de Regra">
              <SelectOrInput value={form.tipo_de_regra || ''} onChange={(v) => set('tipo_de_regra', v)} options={opts('tipos')} placeholder="Selecionar tipo" />
            </Field>
            <Field label="Protocolo Parceiro">
              <SelectOrInput value={form.protocolo_parceiro || ''} onChange={(v) => set('protocolo_parceiro', v)} options={opts('protocolos')} placeholder="FTP, SFTP..." />
            </Field>
            <Field label="Resultado Esperado">
              <Input value={form.resultado_esperado || ''} onChange={(e) => set('resultado_esperado', e.target.value)} />
            </Field>
            <Field label="Resultado">
              <Select value={form.resultado || ''} onValueChange={(v) => set('resultado', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {STATIC_RESULTADOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Versão do edie">
              <SelectOrInput value={form.versao_do_edie || ''} onChange={(v) => set('versao_do_edie', v)} options={opts('versoes')} placeholder="Ex: V_5.1" />
            </Field>
            <Field label="Build">
              <Input value={form.build || ''} onChange={(e) => set('build', e.target.value)} placeholder="Ex: 1234" />
            </Field>
            <Field label="Criticidade">
              <SelectOrInput value={form.criticidade_issue || ''} onChange={(v) => set('criticidade_issue', v)} options={opts('criticidades')} placeholder="Alta, Média, Baixa" />
            </Field>
            <Field label="Issue">
              <Input value={form.issue || ''} onChange={(e) => set('issue', e.target.value)} placeholder="Ex: EDI-123" />
            </Field>
          </div>
          <Field label="Clientes que utilizam">
            <Input value={form.clientes_utilizam_funcionalidade || ''} onChange={(e) => set('clientes_utilizam_funcionalidade', e.target.value)} />
          </Field>
          <Field label="Detalhamento da Execução">
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[80px]"
              value={form.detalhamento_da_execucao_do_teste || ''}
              onChange={(e) => set('detalhamento_da_execucao_do_teste', e.target.value)}
            />
          </Field>
          <Field label="Observações">
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[60px]"
              value={form.observacoes || ''}
              onChange={(e) => set('observacoes', e.target.value)}
            />
          </Field>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SelectOrInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  if (options.length > 0) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}
