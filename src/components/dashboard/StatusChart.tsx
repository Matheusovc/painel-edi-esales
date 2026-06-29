'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Props as LegendProps } from 'recharts/types/component/DefaultLegendContent'
import { CHART_COLORS } from '@/lib/utils'
import { GlassEffect } from '@/components/ui/liquid-glass'
import type { ResumoStatus } from '@/types'

interface Props { data: ResumoStatus[] }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#0D1321] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{payload[0].name}</p>
      <p className="text-xl font-bold text-blue-500 dark:text-blue-400 font-mono">
        {payload[0].value.toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

const renderLegend = (props: LegendProps) => {
  const { payload = [] } = props
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color ?? '#64748b' }} />
          <span className="text-[11px] text-slate-500 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function StatusChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: item.status,
    value: Number(item.total),
    color: CHART_COLORS[item.status as keyof typeof CHART_COLORS] ?? '#64748b',
  }))

  return (
    <GlassEffect variant="card" className="rounded-2xl">
      <div className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Distribuição por Status</h3>
        <p className="text-xs text-slate-500 mt-0.5">Visão consolidada Windows + Linux</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </GlassEffect>
  )
}
