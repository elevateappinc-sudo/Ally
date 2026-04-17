'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
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
        Sofía AI
      </h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 32 }}>Iniciá sesión en tu cuenta</p>

      <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          required style={inputStyle}
        />
        <input
          type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
          required style={inputStyle}
        />
        {error && <p style={{ color: 'var(--siri-pink)', fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div style={{ margin: '24px 0', textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13 }}>o</div>

      <button onClick={handleGoogle} className="btn btn-glass" style={{ width: '100%' }}>
        Continuar con Google
      </button>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' }}>
        ¿No tenés cuenta?{' '}
        <a href="/signup" style={{ color: 'var(--siri-cyan)' }}>Registrate</a>
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', width: '100%',
}
