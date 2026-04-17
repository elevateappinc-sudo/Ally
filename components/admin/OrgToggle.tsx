'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function OrgToggle({ orgId, isActive }: { orgId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    await supabase.from('organizations').update({ is_active: !active }).eq('id', orgId)
    setActive(a => !a)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      style={{
        padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        background: active ? 'rgba(100,210,255,0.15)' : 'rgba(255,45,85,0.15)',
        color: active ? 'var(--siri-cyan)' : 'var(--siri-pink)',
      }}>
      {loading ? '...' : active ? 'Activa' : 'Inactiva'}
    </button>
  )
}
