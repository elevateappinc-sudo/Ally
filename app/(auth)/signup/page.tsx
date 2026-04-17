'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthUser, setOauthUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Detect already-authenticated OAuth users (no org yet)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setOauthUser(user)
    })
  }, [supabase])

  async function createOrg(userId: string) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: businessName, slug: slugify(businessName) })
      .select().single()
    if (orgError || !org) {
      setError('Error al crear organización'); return false
    }
    await supabase.from('organization_members').insert({
      org_id: org.id, user_id: userId, role: 'owner',
    })
    document.cookie = `active_org_id=${org.id}; path=/; max-age=31536000`
    return true
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    if (oauthUser) {
      // Already signed in via Google — just create the org
      const ok = await createOrg(oauthUser.id)
      if (ok) router.push('/onboarding')
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message || 'Error al registrar'); setLoading(false); return
    }
    const ok = await createOrg(authData.user.id)
    if (ok) router.push('/onboarding')
    setLoading(false)
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
        {oauthUser ? '¿Cómo se llama tu negocio?' : 'Empezá gratis'}
      </h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 32 }}>
        {oauthUser ? `Cuenta de Google lista. Solo falta el nombre de tu negocio.` : 'Crea tu cuenta de Sofía AI'}
      </p>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input placeholder="Nombre de tu negocio" value={businessName}
          onChange={e => setBusinessName(e.target.value)} required style={inputStyle} />
        {!oauthUser && (
          <>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Contraseña (min. 8 caracteres)" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </>
        )}
        {error && <p style={{ color: 'var(--siri-pink)', fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : oauthUser ? 'Continuar' : 'Crear cuenta'}
        </button>
      </form>

      {!oauthUser && (
        <>
          <div style={{ margin: '24px 0', textAlign: 'center', color: 'var(--text-dimmer)', fontSize: 13 }}>o</div>
          <button onClick={handleGoogle} className="btn btn-glass" style={{ width: '100%' }}>
            Continuar con Google
          </button>
          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' }}>
            ¿Ya tenés cuenta?{' '}
            <a href="/login" style={{ color: 'var(--siri-cyan)' }}>Iniciá sesión</a>
          </p>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', width: '100%',
}
