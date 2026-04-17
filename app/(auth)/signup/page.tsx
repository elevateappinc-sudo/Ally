'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message || 'Error al registrar')
      setLoading(false)
      return
    }

    // 2. Create org via server API (uses admin client, bypasses RLS)
    const res = await fetch('/api/create-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: businessName }),
    })
    if (!res.ok) {
      setError('Error al crear el negocio')
      setLoading(false)
      return
    }

    // 3. Go to onboarding — no ?setup=1 so business name won't be asked again
    router.push('/onboarding')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="glass fade-in" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
      <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Empezá gratis
      </h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 32 }}>Creá tu cuenta de Sofía AI</p>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          placeholder="Nombre de tu negocio"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña (min. 8 caracteres)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        {error && <p style={{ color: 'var(--siri-pink)', fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>

      <div style={{ margin: '24px 0', textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13 }}>o</div>

      <button onClick={handleGoogle} className="btn btn-glass" style={{ width: '100%' }}>
        Continuar con Google
      </button>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' }}>
        ¿Ya tenés cuenta?{' '}
        <a href="/login" style={{ color: 'var(--siri-cyan)' }}>Iniciá sesión</a>
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '14px 16px',
  color: 'white',
  fontSize: 15,
  outline: 'none',
  width: '100%',
}
