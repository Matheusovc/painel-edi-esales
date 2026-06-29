'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FlaskConical, List, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',       label: 'Dashboard', icon: LayoutDashboard },
  { href: '/testes', label: 'Testes',    icon: FlaskConical    },
  { href: '/listas', label: 'Listas',    icon: List            },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <aside className="flex flex-col w-60 h-screen shrink-0 bg-[#080C14]/75 backdrop-blur-xl backdrop-saturate-150 border-r border-white/[0.08]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[22px] border-b border-white/[0.05]">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30 shrink-0">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-wide">e.Sales</p>
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-blue-400/60">@EDI Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em] px-3 mb-3">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group',
                active
                  ? 'text-blue-300'
                  : 'text-slate-500 hover:text-slate-200'
              )}
            >
              {active && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/[0.12] border border-blue-500/20" />
              )}
              {!active && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-white/[0.04] transition-opacity duration-200" />
              )}

              <Icon className={cn(
                'relative w-4 h-4 shrink-0 transition-colors duration-200',
                active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-300'
              )} />
              <span className="relative">{label}</span>

              {active && (
                <div className="relative ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50 block" />
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Version badge */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
          <p className="text-[10px] text-slate-600 font-medium">Painel de Testes</p>
          <p className="text-[10px] text-slate-700">v1.0 · e.Sales</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-5 pt-1 border-t border-white/[0.05]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 cursor-pointer group"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-colors duration-200 group-hover:text-red-400" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
