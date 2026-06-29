'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Clock, Plus, Edit2, Trash2, Play, StopCircle, FlaskConical } from 'lucide-react'
import type { HistoricoItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  idPk: number
  nomeDaRegra: string
  tabelaOrigem: string
}

const ACAO_CONFIG: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  CRIACAO:           { label: 'Criação',         icon: Plus,        color: 'text-emerald-500' },
  EDICAO:            { label: 'Edição',           icon: Edit2,       color: 'text-blue-500'    },
  EXCLUSAO:          { label: 'Exclusão',         icon: Trash2,      color: 'text-red-500'     },
  INICIO_EXECUCAO:   { label: 'Iniciada',         icon: Play,        color: 'text-yellow-500'  },
  FIM_EXECUCAO:      { label: 'Encerrada',        icon: StopCircle,  color: 'text-slate-500'   },
  CASO_TESTE_CRIADO: { label: 'Caso de Teste',    icon: FlaskConical,color: 'text-purple-500'  },
  CASO_TESTE_STATUS: { label: 'Status Caso',      icon: FlaskConical,color: 'text-purple-400'  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function HistoricoModal({ open, onClose, idPk, nomeDaRegra, tabelaOrigem }: Props) {
  const [items, setItems] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/historico?tabela=${tabelaOrigem}&id_pk=${idPk}`)
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, idPk, tabelaOrigem])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Histórico de Alterações
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{nomeDaRegra}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-500 gap-2">
            <Clock className="w-8 h-8 opacity-20" />
            <p className="text-sm">Nenhum histórico registrado</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-white/[0.06]" />
            <div className="space-y-1">
              {items.map((item) => {
                const cfg = ACAO_CONFIG[item.acao] ?? { label: item.acao, icon: Clock, color: 'text-slate-400' }
                const Icon = cfg.icon
                return (
                  <div key={item.id} className="relative flex gap-3 pl-1 pr-2 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[11px] text-slate-400 shrink-0">{formatDate(item.data_hora)}</span>
                      </div>
                      {item.campo_alterado && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Campo: <span className="font-mono text-slate-600 dark:text-slate-400">{item.campo_alterado}</span>
                        </p>
                      )}
                      {(item.valor_anterior || item.valor_novo) && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                          {item.valor_anterior && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through">{item.valor_anterior}</span>
                          )}
                          {item.valor_anterior && item.valor_novo && <span className="text-slate-400">→</span>}
                          {item.valor_novo && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">{item.valor_novo}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
