'use client'

import { useEffect, useState } from 'react'
import { List, Loader2, Tag } from 'lucide-react'

export default function ListasPage() {
  const [listas, setListas] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/listas')
      .then((r) => r.json())
      .then((d) => setListas(d.listas ?? {}))
      .catch(() => setError('Erro ao carregar listas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <List className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest">Configuração</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Listas
        </h1>
        <p className="text-sm text-slate-500 mt-1">Valores disponíveis nos dropdowns do sistema</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando listas...
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && Object.keys(listas).length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <List className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-sm">Nenhum valor encontrado na tabela <code className="text-slate-500">listas</code>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(listas).map(([categoria, valores]) => (
          <div
            key={categoria}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 capitalize">{categoria}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
                {valores.length}
              </span>
            </div>
            <ul className="p-3 space-y-0.5">
              {valores.map((valor, i) => (
                <li
                  key={i}
                  className="text-[12px] text-slate-400 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] hover:text-slate-200 transition-colors duration-150 cursor-default"
                >
                  {valor}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
