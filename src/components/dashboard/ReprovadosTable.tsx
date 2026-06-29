'use client'

import { AlertTriangle } from 'lucide-react'
import { STATUS_CONFIG } from '@/lib/utils'
import { GlassEffect } from '@/components/ui/liquid-glass'
import type { RegraReprovada } from '@/types'

interface Props { data: RegraReprovada[] }

const CRITICIDADE_COLOR: Record<string, string> = {
  Alta:    'text-red-600 dark:text-red-400 font-semibold',
  Média:   'text-orange-600 dark:text-orange-400',
  Baixa:   'text-yellow-600 dark:text-yellow-400',
  Aprovada:'text-emerald-600 dark:text-emerald-400',
}

export function ReprovadosTable({ data }: Props) {
  return (
    <GlassEffect variant="card" className="rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Regras Reprovadas</h3>
            <p className="text-[11px] text-slate-500">Com issue ou status reprovado</p>
          </div>
        </div>
        {data.length > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            {data.length} regra{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
          <AlertTriangle className="w-8 h-8 opacity-20" />
          <p className="text-sm">Nenhuma regra reprovada</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-72 scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05]">
                {['SO', 'ID', 'Nome da Regra', 'Status', 'Criticidade'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const cfg = STATUS_CONFIG[row.resultado]
                return (
                  <tr
                    key={i}
                    className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{row.localizacao}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-slate-500">{row.id}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-[12px] text-slate-700 dark:text-slate-200 truncate font-medium" title={row.nome_da_regra}>
                        {row.nome_da_regra}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {cfg ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cfg.variant}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} shrink-0`} />
                          {cfg.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">{row.resultado}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium ${CRITICIDADE_COLOR[row.criticidade] ?? 'text-slate-500'}`}>
                        {row.criticidade || '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassEffect>
  )
}
