'use client'

import { useEffect, useState } from 'react'
import { Play, Monitor, Terminal, Clock, Loader2, Zap } from 'lucide-react'
import { GlassEffect } from '@/components/ui/liquid-glass'
import type { ExecucaoRegra } from '@/types'

function formatDuration(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins % 60}min`
  if (mins  > 0) return `${mins}min`
  return 'agora'
}

export function ActiveRulesCard() {
  const [rules, setRules] = useState<ExecucaoRegra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/execucao')
      .then((r) => r.json())
      .then((d) => setRules(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <GlassEffect variant="card" className="rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/15">
          <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Regras em Execução</h3>
          <p className="text-[11px] text-slate-500">Estamos atuando nestas regras agora</p>
        </div>
        {rules.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {rules.length} ativa{rules.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 gap-2">
          <Zap className="w-8 h-8 opacity-20" />
          <p className="text-sm">Nenhuma regra em execução no momento</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {rules.map((rule) => {
            const isLinux = rule.tabela_origem === 'testes_linux'
            return (
              <div key={rule.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5 ${isLinux ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                  {isLinux
                    ? <Terminal className="w-3.5 h-3.5 text-orange-400" />
                    : <Monitor className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {rule.nome_da_regra || '—'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {rule.protocolo_parceiro && (
                      <span className="text-[11px] text-slate-500">{rule.protocolo_parceiro}</span>
                    )}
                    {rule.executor_da_regra && (
                      <span className="text-[11px] text-slate-400 font-mono">{rule.executor_da_regra}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(rule.inicio_execucao)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </GlassEffect>
  )
}
