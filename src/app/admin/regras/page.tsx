'use client'

import { useEffect, useState } from 'react'
import { Settings2, Monitor, Terminal, Layers, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { TestesTable } from '@/components/testes/TestesTable'
import { GlassEffect } from '@/components/ui/liquid-glass'
import { cn } from '@/lib/utils'
import type { DashboardKpi } from '@/types'

type OsTab = 'all' | 'windows' | 'linux'

const OS_TABS: { value: OsTab; label: string; icon: typeof Monitor }[] = [
  { value: 'all',     label: 'Todos',   icon: Layers   },
  { value: 'windows', label: 'Windows', icon: Monitor  },
  { value: 'linux',   label: 'Linux',   icon: Terminal },
]

interface Stats {
  total: number
  aprovados: number
  reprovados: number
  em_andamento: number
  nao_iniciado: number
  pct_aprovados: number
  pct_reprovados: number
}

export default function RegrasPage() {
  const [os, setOs] = useState<OsTab>('all')
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    setStatsLoading(true)
    fetch('/api/dashboard')
      .then(r => r.json())
      .then((d: { kpi?: DashboardKpi }) => {
        const k = d.kpi
        if (!k) return
        setStats({
          total: Number(k.total_regras),
          aprovados: Number(k.aprovados),
          reprovados: Number(k.reprovados),
          em_andamento: Number(k.em_andamento),
          nao_iniciado: Number(k.nao_iniciado),
          pct_aprovados: Number(k.pct_aprovados),
          pct_reprovados: Number(k.pct_reprovados),
        })
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest">Administração</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Gestão de Regras
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cadastre, edite, exclua e acompanhe o histórico de todas as regras de protocolo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <GlassEffect key={i} variant="card" className="rounded-2xl w-full">
              <div className="px-5 py-4 animate-pulse">
                <div className="h-3 w-16 bg-white/[0.06] rounded mb-3" />
                <div className="h-7 w-10 bg-white/[0.08] rounded" />
              </div>
            </GlassEffect>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total de Regras"
              value={stats.total}
              icon={<Layers className="w-4 h-4" />}
              color="text-slate-300"
              border="border-white/[0.07]"
            />
            <StatCard
              label="Aprovadas"
              value={stats.aprovados}
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="text-emerald-400"
              border="border-emerald-500/20"
              sub={`${stats.pct_aprovados.toFixed(1)}%`}
            />
            <StatCard
              label="Reprovadas"
              value={stats.reprovados}
              icon={<XCircle className="w-4 h-4" />}
              color="text-red-400"
              border="border-red-500/20"
              sub={`${stats.pct_reprovados.toFixed(1)}%`}
            />
            <StatCard
              label="Em Andamento"
              value={stats.em_andamento}
              icon={<Loader2 className="w-4 h-4" />}
              color="text-amber-400"
              border="border-amber-500/20"
            />
            <StatCard
              label="Não Iniciadas"
              value={stats.nao_iniciado}
              icon={<Clock className="w-4 h-4" />}
              color="text-slate-500"
              border="border-white/[0.06]"
            />
          </>
        ) : null}
      </div>

      {/* OS Tabs */}
      <div className="flex items-center gap-1 w-fit p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
        {OS_TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setOs(value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              os === value
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tabela de gestão — sem coluna "Iniciar" */}
      <TestesTable os={os} hideExecucao />
    </div>
  )
}

function StatCard({ label, value, icon, color, sub }: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  border?: string
  sub?: string
}) {
  return (
    <GlassEffect variant="card" className="rounded-2xl w-full">
      <div className="px-5 py-4">
        <div className={`flex items-center gap-2 mb-2 ${color}`}>
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <p className={`text-2xl font-bold font-mono ${color}`}>{value.toLocaleString('pt-BR')}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </GlassEffect>
  )
}
