import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Painel de Testes @EDI · e.Sales',
  description: 'Painel de testes de protocolos de transmissão EDI — e.Sales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <AppShell>{children}</AppShell>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(220 39% 8%)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'hsl(210 40% 93%)',
            },
          }}
        />
      </body>
    </html>
  )
}
