'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.replace('/login?error=oauth')
      return
    }

    // Exchange the code CLIENT-SIDE — the browser Supabase client stores the
    // session directly in its own cookies. No server-side cookie forwarding needed.
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace('/login?error=oauth')
        return
      }
      // Session is now established in the browser — go to routing page
      router.replace('/auth/done')
    })
  }, [])

  return null
}

export default function CallbackPage() {
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
      <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Conectando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
