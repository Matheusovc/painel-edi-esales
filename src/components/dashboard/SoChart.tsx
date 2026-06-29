'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { GlassEffect } from '@/components/ui/liquid-glass'
import type { ResumoPorSo } from '@/types'

interface Props { data: ResumoPorSo[] }

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#0D1321] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl min-w-[140px]">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{p.name}</span>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function SoChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: item.origem === 'windows' ? 'Windows' : 'Linux',
    Aprovados: Number(item.aprovados),
    Reprovados: Number(item.reprovados),
    'Não Iniciado': Number(item.nao_iniciado),
  }))

  return (
    <GlassEffect variant="card" className="rounded-2xl">
      <div className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Windows vs Linux</h3>
        <p className="text-xs text-slate-500 mt-0.5">Comparativo por sistema operacional</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="35%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Fira Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Fira Code' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'Fira Sans' }}>{value}</span>
            )}
            iconType="rect"
            iconSize={8}
          />
          <Bar dataKey="Aprovados"    fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Reprovados"   fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Não Iniciado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </GlassEffect>
  )
}
