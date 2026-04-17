'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthDonePage() {
  const router = useRouter()
  const supabase = createClient()
  const handled = useRef(false)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION once the client has loaded
    // the session from cookies — more reliable than calling getUser() directly
    // since the browser client needs a tick to hydrate from server-set cookies.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled.current) return
        if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return
        handled.current = true

        if (!session?.user) {
          router.replace('/login?error=oauth')
          return
        }

        const user = session.user

        // Check if user already has an org
        const { data: member } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (member?.org_id) {
          document.cookie = `active_org_id=${member.org_id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
          router.replace('/dashboard')
          return
        }

        // New Google user — create draft org
        const displayName =
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Mi negocio'

        const res = await fetch('/api/create-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: displayName }),
        })

        if (res.ok) {
          const { orgId } = await res.json()
          document.cookie = `active_org_id=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
          router.replace('/onboarding?setup=1')
        } else {
          router.replace('/signup')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--siri-cyan)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Iniciando sesión...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
