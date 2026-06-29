import { STATUS_CONFIG } from '@/lib/utils'

interface Props { status: string }

export function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
        {status || '—'}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${cfg.variant}`}
      style={{ borderColor: 'transparent' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} shrink-0`} />
      {cfg.label}
    </span>
  )
}
