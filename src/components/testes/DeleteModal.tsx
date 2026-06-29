'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onDeleted: () => void
  idPk: number
  nomeDaRegra: string
  os: 'windows' | 'linux'
}

export function DeleteModal({ open, onClose, onDeleted, idPk, nomeDaRegra, os }: Props) {
  const [step, setStep] = useState<'confirm' | 'password'>('confirm')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setStep('confirm')
    setPassword('')
    setError('')
    onClose()
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/testes/${idPk}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, os }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Senha incorreta ou erro inesperado.')
        return
      }
      toast.success('Regra excluída com sucesso.')
      handleClose()
      onDeleted()
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Excluir Regra
          </DialogTitle>
          <DialogDescription>
            Esta ação <strong>não pode ser desfeita</strong>. A regra será removida permanentemente do banco de dados.
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' ? (
          <>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Regra selecionada:</p>
              <p className="font-medium text-foreground mt-0.5 break-words">{nomeDaRegra}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button variant="destructive" onClick={() => setStep('password')}>
                Sim, excluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <Label htmlFor="admin-password">Senha de administrador</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Digite a senha para confirmar"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && password && handleDelete()}
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} disabled={loading}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || !password}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar exclusão'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
