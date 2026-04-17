'use client'
import { ContentPost } from '@/lib/supabase/types'

export function StatsBar({ posts }: { posts: ContentPost[] }) {
  const approved = posts.filter(p => p.status === 'approved').length
  const pending = posts.filter(p => p.status === 'pending').length
  const total = posts.length

  return (
    <div className="glass" style={{ display: 'flex', padding: '14px 20px', gap: 0 }}>
      {[
        { label: 'Aprobados', value: approved, color: 'var(--siri-cyan)' },
        { label: 'Pendientes', value: pending, color: 'var(--siri-purple)' },
        { label: 'Total', value: total, color: 'var(--text)' },
      ].map((s, i) => (
        <div key={s.label} style={{
          flex: 1, textAlign: 'center',
          borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
          <p style={{ fontSize: 11, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
