'use client'
import { ContentPost } from '@/lib/supabase/types'

interface Props {
  posts: ContentPost[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

function getDayColor(status: string | undefined) {
  if (!status) return 'transparent'
  if (status === 'approved') return 'var(--siri-cyan)'
  if (status === 'skipped') return 'var(--text-dimmer)'
  return 'var(--siri-purple)'
}

export function WeekStrip({ posts, selectedDate, onSelectDate }: Props) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i + 1) // Mon-Sun
    return d
  })

  const postsByDate = posts.reduce((acc, p) => {
    acc[p.post_date] = p; return acc
  }, {} as Record<string, ContentPost>)

  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
      {days.map((d, i) => {
        const dateStr = d.toISOString().split('T')[0]
        const post = postsByDate[dateStr]
        const isSelected = dateStr === selectedDate
        return (
          <button key={dateStr} onClick={() => onSelectDate(dateStr)}
            style={{
              flexShrink: 0, width: 48, minHeight: 56, borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4,
              background: isSelected
                ? 'linear-gradient(135deg, rgba(10,132,255,0.3), rgba(191,90,242,0.3))'
                : 'rgba(255,255,255,0.05)',
              border: isSelected ? '1px solid rgba(100,210,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <span style={{ fontSize: 9, color: 'var(--text-dimmer)', fontWeight: 600 }}>{dayNames[i]}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{d.getDate()}</span>
            {post && (
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: getDayColor(post.status),
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
