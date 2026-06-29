'use client'

import { usePathname } from 'next/navigation'
import ShaderBackground from '@/components/ui/shader-background'
import { TopNav } from './TopNav'
import { ChatBot } from '@/components/chat/ChatBot'
import { GlassFilter } from '@/components/ui/liquid-glass'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <ShaderBackground />
      {/* SVG filter shared globally — only rendered once */}
      <GlassFilter />
      <TopNav />
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto pt-24 scrollbar-thin">
          {children}
        </main>
      </div>
      <ChatBot />
    </>
  )
}
