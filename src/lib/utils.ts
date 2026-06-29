import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_CONFIG: Record<string, { label: string; variant: string; dotColor: string }> = {
  Aprovado: {
    label: 'Aprovado',
    variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  Reprovado: {
    label: 'Reprovado',
    variant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  'Em Andamento': {
    label: 'Em Andamento',
    variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  'Aguardando Ação': {
    label: 'Aguardando Ação',
    variant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    dotColor: 'bg-orange-500',
  },
  Volumetria: {
    label: 'Volumetria',
    variant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    dotColor: 'bg-purple-500',
  },
  'Não Iniciado': {
    label: 'Não Iniciado',
    variant: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    dotColor: 'bg-slate-400',
  },
}

export const CHART_COLORS = {
  Aprovado: '#22c55e',
  Reprovado: '#ef4444',
  'Em Andamento': '#eab308',
  'Aguardando Ação': '#f97316',
  Volumetria: '#a855f7',
  'Não Iniciado': '#94a3b8',
}
