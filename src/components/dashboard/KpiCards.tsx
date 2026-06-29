'use client'

import { CheckCircle2, XCircle, Clock, AlertCircle, BarChart3, Circle, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassEffect } from '@/components/ui/liquid-glass'
import type { DashboardKpi } from '@/types'

interface Props { kpi: DashboardKpi }

const cards = [
  {
    key: 'total_regras' as keyof DashboardKpi,
    label: 'Total',
    icon: Hash,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500 dark:text-blue-400',
    accent: 'group-hover:via-blue-400',
    glow: 'group-hover:shadow-blue-500/10',
  },
  {
    key: 'aprovados' as keyof DashboardKpi,
    label: 'Aprovados',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: 'group-hover:via-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
    pct: 'pct_aprovados' as keyof DashboardKpi,
    pctColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'reprovados' as keyof DashboardKpi,
    label: 'Reprovados',
    icon: XCircle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: 'group-hover:via-red-400',
    glow: 'group-hover:shadow-red-500/10',
    pct: 'pct_reprovados' as keyof DashboardKpi,
    pctColor: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'em_andamento' as keyof DashboardKpi,
    label: 'Em Andamento',
    icon: Clock,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    accent: 'group-hover:via-yellow-400',
    glow: 'group-hover:shadow-yellow-500/10',
  },
  {
    key: 'aguardando' as keyof DashboardKpi,
    label: 'Aguardando',
    icon: AlertCircle,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accent: 'group-hover:via-orange-400',
    glow: 'group-hover:shadow-orange-500/10',
  },
  {
    key: 'volumetria' as keyof DashboardKpi,
    label: 'Volumetria',
    icon: BarChart3,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accent: 'group-hover:via-purple-400',
    glow: 'group-hover:shadow-purple-500/10',
  },
  {
    key: 'nao_iniciado' as keyof DashboardKpi,
    label: 'Não Iniciado',
    icon: Circle,
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-500 dark:text-slate-400',
    accent: 'group-hover:via-slate-400',
    glow: 'group-hover:shadow-slate-500/10',
  },
]

export function KpiCards({ kpi }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map(({ key, label, icon: Icon, iconBg, iconColor, accent, glow, pct, pctColor }) => {
        const value = kpi[key] ?? 0
        const pctValue = pct ? kpi[pct] : null
        return (
          <GlassEffect
            key={key}
            variant="card"
            className={cn('rounded-2xl group', glow)}
          >
            <div className="p-4">
              <div className={cn('inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3', iconBg)}>
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>

              <p className="text-2xl font-bold text-white font-mono tracking-tight leading-none">
                {Number(value).toLocaleString('pt-BR')}
              </p>

              <p className="text-[11px] text-slate-400 mt-1.5 leading-tight font-medium">{label}</p>

              {pctValue !== null && (
                <div className={cn('text-[11px] font-bold mt-2', pctColor)}>
                  {Number(pctValue).toFixed(1)}%
                </div>
              )}
            </div>
          </GlassEffect>
        )
      })}
    </div>
  )
}
