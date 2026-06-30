'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FlaskConical, List, Zap, LogOut, PlayCircle, Layers, Users, Settings2, TestTube2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassEffect } from '@/components/ui/liquid-glass'
import { VideoModal } from './VideoModal'

const navItems = [
  { href: '/',                  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/testes',            label: 'Testes',    icon: FlaskConical    },
  { href: '/listas',            label: 'Listas',    icon: List            },
  { href: '/bitrix',            label: 'Bitrix',    icon: Layers          },
  { href: '/admin/regras',       label: 'Regras',    icon: Settings2  },
  { href: '/admin/casos-teste', label: 'Casos',     icon: TestTube2  },
  { href: '/admin/usuarios',    label: 'Usuários',  icon: Users      },
]

export function TopNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [videoOpen, setVideoOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <>
    <div className="fixed top-4 left-4 right-4 z-50">
      <GlassEffect
        className="rounded-2xl w-full"
        style={{ borderRadius: '1rem' }}
      >
        <div className="flex items-center gap-3 px-5 py-3.5 w-full">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white tracking-wide">e.Sales</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-blue-300/70 mt-0.5">@EDI Panel</p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0 mx-1" />

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-blue-200 bg-blue-500/20 border border-blue-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/[0.07]'
                  )}
                >
                  <Icon className={cn(
                    'w-4 h-4 shrink-0',
                    active ? 'text-blue-300' : 'text-white/40'
                  )} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side: tutorial button + version + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setVideoOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-blue-300/80 hover:text-blue-200 hover:bg-blue-500/[0.12] border border-blue-500/20 hover:border-blue-400/30 transition-all duration-200 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Como usar o EDI Assistant</span>
            </button>
            <span className="hidden sm:block text-[10px] text-white/25 font-medium">v1.0</span>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-red-500/[0.1] transition-all duration-200 cursor-pointer group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-300 transition-colors" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

        </div>
      </GlassEffect>
    </div>

    <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  )
}
