'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShaderAnimation } from '@/components/ui/shader-lines'
import { Zap, Eye, EyeOff, Loader2, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSenha, setShowSenha] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setNome('')
    setEmail('')
    setSenha('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (mode === 'register' && nome.trim().length < 2) {
      setError('Nome deve ter no mínimo 2 caracteres')
      return
    }
    if (!email.trim()) {
      setError('E-mail é obrigatório')
      return
    }
    if (senha.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, senha }
        : { nome, email, senha }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro desconhecido')
        return
      }

      router.replace('/')
    } catch {
      setError('Falha na conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <ShaderAnimation />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[rgba(8,12,20,0.85)] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/40 mb-4">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">e.Sales</h1>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-blue-400/60 mt-0.5">
              @EDI Panel
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex p-1 rounded-xl bg-white/[0.05] border border-white/[0.07] mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                  mode === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {m === 'login'
                  ? <><LogIn className="w-3.5 h-3.5" /> Entrar</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Criar conta</>
                }
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field
                label="Nome"
                icon={<User className="w-4 h-4" />}
                type="text"
                value={nome}
                onChange={setNome}
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            )}

            <Field
              label="E-mail"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {senha.length > 0 && senha.length < 8 && (
                <p className="text-[11px] text-amber-400 mt-1">
                  {8 - senha.length} caractere{8 - senha.length !== 1 ? 's' : ''} faltando
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
                : mode === 'login' ? 'Entrar' : 'Criar conta'
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-600 mt-6">
            Painel de Testes @EDI · e.Sales v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, icon, type, value, onChange, placeholder, autoComplete,
}: {
  label: string
  icon: React.ReactNode
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
        />
      </div>
    </div>
  )
}
