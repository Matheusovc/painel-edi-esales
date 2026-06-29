'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onUpdated: () => void
  idPk: number
  nomeDaRegra: string
  resultadoAtual: string
  os: 'windows' | 'linux'
}

const RESULTADOS = [
  'Aprovado', 'Reprovado', 'Em Andamento', 'Aguardando Ação', 'Volumetria', 'Não Iniciado',
]

export function EditResultadoModal({
  open, onClose, onUpdated, idPk, nomeDaRegra, resultadoAtual, os,
}: Props) {
  const [resultado, setResultado] = useState(resultadoAtual)
  const [saving, setSaving] = useState(false)

  function handleClose() {
    setResultado(resultadoAtual)
    onClose()
  }

  async function handleSave() {
    if (resultado === resultadoAtual) { onClose(); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/testes/${idPk}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado, os }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erro ao atualizar resultado.')
        return
      }
      toast.success('Resultado atualizado!')
      onUpdated()
      onClose()
    } catch {
      toast.error('Falha de conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Resultado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground truncate" title={nomeDaRegra}>{nomeDaRegra}</p>
          <div className="space-y-1.5">
            <Label>Resultado</Label>
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESULTADOS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
