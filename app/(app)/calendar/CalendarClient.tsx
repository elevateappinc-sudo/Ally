'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  platform: string
  date: string
  day: string
  pillar: string
  format: string
  caption: string
  visual_brief: string
  hashtags: string[]
  best_time: string
  cta: string
}

interface Week {
  week: number
  start_date: string
  theme: string
  posts: Post[]
}

interface CalendarData {
  weeks: Week[]
  platforms: string[]
  total_posts: number
  period_start: string
  period_end: string
}

interface Props {
  orgId: string
  sessionId: string
  businessBrief: any
  brandStrategy: any
  platforms: string[]
  initialCalendar: CalendarData | null
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#c084fc',
  facebook: '#60a5fa',
  google_business: '#34d399',
  tiktok: '#f87171',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google_business: 'Google Business',
  tiktok: 'TikTok',
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function CalendarClient({ orgId, sessionId, businessBrief, brandStrategy, platforms, initialCalendar }: Props) {
  const router = useRouter()
  const [calendar, setCalendar] = useState<CalendarData | null>(initialCalendar)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Iniciando...')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(!initialCalendar)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  const startedRef = useRef(false)

  useEffect(() => {
    if (initialCalendar || startedRef.current) return
    startedRef.current = true
    generateCalendar()
  }, [])

  async function generateCalendar() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/4/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          session_id: sessionId,
          business_brief: businessBrief,
          brand_strategy: brandStrategy,
          platforms,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Error al iniciar la generación')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'progress') {
              setProgress(evt.progress)
              setProgressMessage(evt.message)
            } else if (evt.type === 'complete') {
              setCalendar(evt.calendar)
              setProgress(100)
              setGenerating(false)
            } else if (evt.type === 'error') {
              throw new Error(evt.message)
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error generando calendario')
      setGenerating(false)
    }
  }

  function toggleWeek(week: number) {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  function handleExportCSV() {
    window.open(`/api/agents/4/export-csv?org_id=${orgId}`, '_blank')
  }

  if (generating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Creando tu calendario de 90 días</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{progressMessage}</p>
        </div>
        <div style={{ width: 320, background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg, #a855f7, #ec4899)', width: `${progress}%`, transition: 'width 0.5s ease', borderRadius: 8 }} />
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{progress}%</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--siri-pink)', fontSize: 16 }}>⚠️ {error}</p>
        <button onClick={generateCalendar} className="btn btn-primary">Intentar de nuevo</button>
        <button onClick={() => router.push('/strategy')} className="btn btn-glass">Volver a estrategia</button>
      </div>
    )
  }

  if (!calendar) return null

  const activePlatforms = calendar.platforms ?? platforms
  const weeks = calendar.weeks ?? []

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Calendario de Contenido</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>{businessBrief?.business_info?.name ?? 'Tu negocio'} · 90 días</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Posts totales', value: String(calendar.total_posts ?? 0) },
          { label: 'Semanas', value: String(weeks.length) },
          { label: 'Plataformas', value: String(activePlatforms.length) },
          {
            label: 'Período',
            value: calendar.period_start
              ? `${formatDate(calendar.period_start)} — ${formatDate(calendar.period_end)}`
              : '90 días',
          },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ color: '#c084fc', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{stat.value}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Platform badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {activePlatforms.map(p => (
          <span
            key={p}
            style={{
              background: `${PLATFORM_COLORS[p] ?? '#888'}22`,
              border: `1px solid ${PLATFORM_COLORS[p] ?? '#888'}55`,
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              color: PLATFORM_COLORS[p] ?? '#888',
              fontWeight: 600,
            }}
          >
            {PLATFORM_LABELS[p] ?? p}
          </span>
        ))}
      </div>

      {/* Weekly accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
        {weeks.map(week => {
          const isOpen = openWeeks.has(week.week)
          return (
            <div key={week.week} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => toggleWeek(week.week)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(168,85,247,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>
                    Sem {week.week}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>{week.theme}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{formatDate(week.start_date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{week.posts?.length ?? 0} posts</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 18, display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '0 16px 16px' }}>
                  {(week.posts ?? []).map((post, i) => {
                    const color = PLATFORM_COLORS[post.platform] ?? '#888'
                    return (
                      <div key={post.id ?? i} style={{ marginTop: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Post header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span style={{ color, fontSize: 13, fontWeight: 700 }}>{PLATFORM_LABELS[post.platform] ?? post.platform}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>· {post.day} {formatDate(post.date)}</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(168,85,247,0.12)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#c084fc' }}>{post.pillar}</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: 'var(--text-dim)' }}>{post.format}</span>
                            <span style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#34d399' }}>{post.best_time}</span>
                          </div>
                        </div>

                        {/* Caption */}
                        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.65, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{post.caption}</p>

                        {/* Visual brief */}
                        <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, borderLeft: '3px solid rgba(168,85,247,0.3)' }}>
                          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>Brief visual</p>
                          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{post.visual_brief}</p>
                        </div>

                        {/* CTA */}
                        <p style={{ marginBottom: 10 }}>
                          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>CTA: </span>
                          <span style={{ color: '#86efac', fontSize: 13, fontWeight: 500 }}>{post.cta}</span>
                        </p>

                        {/* Hashtags */}
                        {(post.hashtags ?? []).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {post.hashtags.map((tag, j) => (
                              <span key={j} style={{ color: '#60a5fa', fontSize: 12 }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleExportCSV} className="btn btn-primary">Exportar CSV ↓</button>
        <button onClick={generateCalendar} className="btn btn-glass" style={{ fontSize: 13 }}>Regenerar calendario</button>
        <button onClick={() => router.push('/dashboard')} className="btn btn-glass" style={{ fontSize: 13 }}>Ir al dashboard</button>
      </div>
    </div>
  )
}
