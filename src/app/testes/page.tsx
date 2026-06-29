'use client'

import { useState } from 'react'
import { TestesTable } from '@/components/testes/TestesTable'
import { Monitor, Terminal, FlaskConical, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

type OsTab = 'all' | 'windows' | 'linux'

const TABS: { value: OsTab; label: string; icon: typeof Monitor }[] = [
  { value: 'all',     label: 'Todos',   icon: Layers   },
  { value: 'windows', label: 'Windows', icon: Monitor  },
  { value: 'linux',   label: 'Linux',   icon: Terminal },
]

export default function TestesPage() {
  const [os, setOs] = useState<OsTab>('all')

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-blue-500 dark:text-blue-400/70 uppercase tracking-widest">Regras</span>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Testes de Protocolos</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie e acompanhe as regras de teste por sistema operacional</p>
      </div>

      {/* OS Toggle */}
      <div className="flex items-center gap-1 w-fit p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07]">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setOs(value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              os === value
                ? 'bg-white dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 shadow-sm dark:shadow-none border border-slate-200 dark:border-blue-500/25'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/70 dark:hover:bg-white/[0.04]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <TestesTable os={os} />
    </div>
  )
}
