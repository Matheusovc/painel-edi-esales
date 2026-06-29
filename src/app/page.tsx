'use client'

import { useEffect, useState } from 'react'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { SoChart } from '@/components/dashboard/SoChart'
import { ReprovadosTable } from '@/components/dashboard/ReprovadosTable'
import { ActiveRulesCard } from '@/components/dashboard/ActiveRulesCard'
import { Loader2, RefreshCw, Activity } from 'lucide-react'
import type { DashboardKpi, ResumoStatus, ResumoPorSo, RegraReprovada } from '@/types'

interface DashboardData {
  kpi: DashboardKpi
  resumoStatus: ResumoStatus[]
  resumoSo: ResumoPorSo[]
  reprovadas: RegraReprovada[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchDashboard() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Não foi possível conectar ao banco de dados. Verifique as configurações no .env.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-500 dark:text-blue-400/70 uppercase tracking-widest">Visão Geral</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Testes de protocolos <span className="text-blue-500 font-medium">@EDI</span> — Windows &amp; Linux
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm dark:shadow-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Carregando dados do banco...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.05] p-8 text-center space-y-3">
          <p className="text-red-600 dark:text-red-400 font-semibold">Erro de conexão</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {data && (
        <>
          <KpiCards kpi={data.kpi} />

          {/* Active Rules */}
          <ActiveRulesCard />

          <div className="border-t border-slate-100 dark:border-white/[0.05]" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <StatusChart data={data.resumoStatus} />
            <SoChart data={data.resumoSo} />
          </div>

          <ReprovadosTable data={data.reprovadas} />
        </>
      )}
    </div>
  )
}
