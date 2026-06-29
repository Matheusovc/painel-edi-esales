'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Listas } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  defaultOs?: 'windows' | 'linux'
}

const EMPTY_FORM = {
  id: '',
  nome_da_regra: '',
  configuracao_da_regra: '',
  executor_da_regra: '',
  tipo_de_regra: '',
  protocolo_parceiro: '',
  clientes_utilizam_funcionalidade: '',
  resultado_esperado: '',
  detalhamento_da_execucao_do_teste: '',
  resultado: '',
  criticidade_issue: '',
  issue: '',
  versao_do_edie: '',
  build: '',
  observacoes: '',
}

const STATIC_RESULTADOS = [
  'Aprovado', 'Reprovado', 'Em Andamento', 'Aguardando Ação', 'Volumetria', 'Não Iniciado',
]

export function NovaRegraModal({ open, onClose, onCreated, defaultOs = 'windows' }: Props) {
  const [os, setOs] = useState<'windows' | 'linux'>(defaultOs)
  const [form, setForm] = useState(EMPTY_FORM)
  const [listas, setListas] = useState<Listas>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/listas')
      .then((r) => r.json())
      .then((d) => setListas(d.listas ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  function handleClose() {
    setForm(EMPTY_FORM)
    setOs(defaultOs)
    onClose()
  }

  function set(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome_da_regra.trim()) {
      toast.error('O campo "Nome da regra" é obrigatório.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/testes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, os }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erro ao criar regra.')
        return
      }
      toast.success('Regra criada com sucesso!')
      handleClose()
      onCreated()
    } catch {
      toast.error('Falha de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const listasOuVazio = (cat: string) => listas[cat] ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Regra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OS selector */}
          <div className="space-y-1.5">
            <Label>Sistema Operacional</Label>
            <Tabs value={os} onValueChange={(v) => setOs(v as 'windows' | 'linux')}>
              <TabsList>
                <TabsTrigger value="windows">Windows</TabsTrigger>
                <TabsTrigger value="linux">Linux</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando listas...
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID (número)">
              <Input type="number" value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="Ex: 1" min="1" />
            </Field>
            <Field label="Nome da Regra *">
              <Input value={form.nome_da_regra} onChange={(e) => set('nome_da_regra', e.target.value)} placeholder="Nome da regra" required />
            </Field>
            <Field label="Configuração da Regra">
              <Input value={form.configuracao_da_regra} onChange={(e) => set('configuracao_da_regra', e.target.value)} />
            </Field>
            <Field label="Executor da Regra">
              <SelectOrInput
                value={form.executor_da_regra}
                onChange={(v) => set('executor_da_regra', v)}
                options={listasOuVazio('executores')}
                placeholder="Selecionar executor"
              />
            </Field>
            <Field label="Tipo de Regra">
              <SelectOrInput
                value={form.tipo_de_regra}
                onChange={(v) => set('tipo_de_regra', v)}
                options={listasOuVazio('tipos')}
                placeholder="Selecionar tipo"
              />
            </Field>
            <Field label="Protocolo Parceiro">
              <SelectOrInput
                value={form.protocolo_parceiro}
                onChange={(v) => set('protocolo_parceiro', v)}
                options={listasOuVazio('protocolos')}
                placeholder="FTP, SFTP, OFTP-S..."
              />
            </Field>
            <Field label="Resultado Esperado">
              <Input value={form.resultado_esperado} onChange={(e) => set('resultado_esperado', e.target.value)} />
            </Field>
            <Field label="Resultado">
              <Select value={form.resultado} onValueChange={(v) => set('resultado', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar resultado" />
                </SelectTrigger>
                <SelectContent>
                  {STATIC_RESULTADOS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Versão do edie">
              <SelectOrInput
                value={form.versao_do_edie}
                onChange={(v) => set('versao_do_edie', v)}
                options={listasOuVazio('versoes')}
                placeholder="Ex: 2.5.0"
              />
            </Field>
            <Field label="Build">
              <Input value={form.build} onChange={(e) => set('build', e.target.value)} placeholder="Ex: 1234" />
            </Field>
            <Field label="Criticidade">
              <SelectOrInput
                value={form.criticidade_issue}
                onChange={(v) => set('criticidade_issue', v)}
                options={listasOuVazio('criticidades')}
                placeholder="Alta, Média, Baixa"
              />
            </Field>
            <Field label="Issue">
              <Input value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="Ex: EDI-123" />
            </Field>
          </div>

          <Field label="Clientes que utilizam">
            <Input value={form.clientes_utilizam_funcionalidade} onChange={(e) => set('clientes_utilizam_funcionalidade', e.target.value)} />
          </Field>
          <Field label="Detalhamento da Execução">
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[80px]"
              value={form.detalhamento_da_execucao_do_teste}
              onChange={(e) => set('detalhamento_da_execucao_do_teste', e.target.value)}
              placeholder="Descreva a execução do teste..."
            />
          </Field>
          <Field label="Observações">
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[60px]"
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Regra'}
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

function SelectOrInput({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  if (options.length > 0) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
