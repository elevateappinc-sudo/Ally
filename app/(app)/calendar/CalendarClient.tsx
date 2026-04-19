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

interface BriefingRow {
  post_id: string
  briefing_data: any
  status: string
}

interface Props {
  orgId: string
  sessionId: string
  businessBrief: any
  brandStrategy: any
  platforms: string[]
  initialCalendar: CalendarData | null
  initialBriefings: BriefingRow[]
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

const BRIEFING_TABS = [
  { id: 'copy', label: 'Copy' },
  { id: 'visual', label: 'Visual' },
  { id: 'publishing', label: 'Publicación' },
  { id: 'tips', label: 'Tips' },
]

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={copy} className="btn btn-glass" style={{ fontSize: 12, padding: '4px 12px' }}>
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

// ── Briefing Tab Components ───────────────────────────────────────────────────

function CopyTab({ briefing }: { briefing: any }) {
  const copy = briefing.copy ?? {}
  const concept = briefing.creative_concept ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Concept */}
      <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 10, padding: 16, borderLeft: '3px solid #a855f7' }}>
        <p style={{ color: '#c084fc', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{concept.title}</p>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}><strong>Hook:</strong> {concept.hook}</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 4 }}><strong>Ángulo:</strong> {concept.angle}</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{concept.why_this_works}</p>
      </div>

      {/* Caption */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Caption</p>
          <CopyButton text={copy.caption ?? ''} />
        </div>
        {copy.first_line && (
          <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 600, marginBottom: 8, padding: '6px 10px', background: 'rgba(168,85,247,0.08)', borderRadius: 6 }}>
            {copy.first_line}
          </p>
        )}
        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{copy.caption}</p>
      </div>

      {/* Hashtags */}
      {(copy.hashtags ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Hashtags ({copy.hashtags.length})</p>
            <CopyButton text={copy.hashtags.join(' ')} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {copy.hashtags.map((tag: string, i: number) => (
              <span key={i} style={{ color: '#60a5fa', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* First comment */}
      {copy.first_comment && (
        <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: 14, borderLeft: '3px solid rgba(16,185,129,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ color: '#34d399', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Primer comentario</p>
            <CopyButton text={copy.first_comment} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{copy.first_comment}</p>
        </div>
      )}
    </div>
  )
}

function VisualTab({ briefing }: { briefing: any }) {
  const vis = briefing.visual ?? {}
  const music = briefing.music
  const isVideo = !!vis.video_scenes || !!vis.pacing
  const isCarousel = !!vis.slides

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Shot + subject */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Tipo de toma</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{vis.shot_type}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Sujeto principal</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{vis.subject}</p>
        </div>
      </div>

      {/* Composition */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Composición</p>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{vis.composition}</p>
      </div>

      {/* Props */}
      {(vis.props ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Elementos en frame</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {vis.props.map((prop: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#a855f7', flexShrink: 0 }}>✦</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{prop}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lighting + colors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Iluminación</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{vis.lighting}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Paleta de colores</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{vis.color_palette}</p>
        </div>
      </div>

      {/* Styling */}
      {vis.styling && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Estilo general</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{vis.styling}</p>
        </div>
      )}

      {/* Video scenes */}
      {isVideo && (vis.video_scenes ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Escenas del video</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vis.video_scenes.map((scene: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ background: 'rgba(168,85,247,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>{scene.timestamp}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{scene.action}</span>
              </div>
            ))}
          </div>
          {vis.pacing && <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 10 }}>Pacing: {vis.pacing}</p>}
          {vis.transitions && <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>Transiciones: {vis.transitions}</p>}
        </div>
      )}

      {/* Carousel slides */}
      {isCarousel && (vis.slides ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Slides del carrusel</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vis.slides.map((slide: any, i: number) => (
              <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '3px solid rgba(168,85,247,0.3)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#a855f7', fontWeight: 700, fontSize: 13 }}>Slide {slide.number}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>{slide.title}</span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{slide.text}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>Visual: {slide.visual}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Music */}
      {music && (
        <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 10, padding: 14, borderLeft: '3px solid rgba(168,85,247,0.3)' }}>
          <p style={{ color: '#c084fc', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Música sugerida</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{music.genre} · {music.mood}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{music.where_to_find}</p>
        </div>
      )}
    </div>
  )
}

function PublishingTab({ briefing }: { briefing: any }) {
  const pub = briefing.publishing ?? {}
  const seo = briefing.seo ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Mejor hora</p>
          <p style={{ color: '#c084fc', fontSize: 20, fontWeight: 700 }}>{pub.optimal_time}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Location tag</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 14 }}>{seo.location_tag}</p>
        </div>
      </div>

      {seo.alt_text && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Alt text (SEO)</p>
            <CopyButton text={seo.alt_text} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{seo.alt_text}</p>
        </div>
      )}

      {seo.primary_keyword && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>Keyword principal</p>
          <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 600 }}>{seo.primary_keyword}</p>
        </div>
      )}

      {pub.facebook_caption && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Versión para Facebook</p>
            <CopyButton text={pub.facebook_caption} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{pub.facebook_caption}</p>
        </div>
      )}
    </div>
  )
}

function TipsTab({ briefing }: { briefing: any }) {
  const tips = briefing.tips ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(tips.pro_tips ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Pro tips</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.pro_tips.map((tip: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#34d399', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tips.avoid ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Evitar</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.avoid.map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tips.engagement_boosters ?? []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Engagement boosters</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.engagement_boosters.map((boost: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#fbbf24', flexShrink: 0 }}>⚡</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5 }}>{boost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CalendarClient({
  orgId, sessionId, businessBrief, brandStrategy, platforms, initialCalendar, initialBriefings,
}: Props) {
  const router = useRouter()
  const [calendar, setCalendar] = useState<CalendarData | null>(initialCalendar)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Iniciando...')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(!initialCalendar)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  const startedRef = useRef(false)

  // Briefing state
  const [briefings, setBriefings] = useState<Record<string, any>>(
    Object.fromEntries((initialBriefings ?? []).map(b => [b.post_id, b.briefing_data]))
  )
  const [postStatuses, setPostStatuses] = useState<Record<string, string>>(
    Object.fromEntries((initialBriefings ?? []).map(b => [b.post_id, b.status]))
  )
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [briefingTab, setBriefingTab] = useState('copy')
  const [generatingBriefing, setGeneratingBriefing] = useState(false)
  const [briefingError, setBriefingError] = useState<string | null>(null)

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
        body: JSON.stringify({ org_id: orgId, session_id: sessionId, business_brief: businessBrief, brand_strategy: brandStrategy, platforms }),
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
            if (evt.type === 'progress') { setProgress(evt.progress); setProgressMessage(evt.message) }
            else if (evt.type === 'complete') { setCalendar(evt.calendar); setProgress(100); setGenerating(false) }
            else if (evt.type === 'error') throw new Error(evt.message)
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error generando calendario')
      setGenerating(false)
    }
  }

  async function generateBriefing(post: Post) {
    setGeneratingBriefing(true)
    setBriefingError(null)
    try {
      const res = await fetch('/api/agents/5/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, post, brand_strategy: brandStrategy, business_brief: businessBrief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando briefing')
      setBriefings(prev => ({ ...prev, [post.id]: data.briefing }))
      setPostStatuses(prev => ({ ...prev, [post.id]: 'briefed' }))
      setBriefingTab('copy')
    } catch (err: any) {
      setBriefingError(err?.message ?? 'Error generando briefing')
    } finally {
      setGeneratingBriefing(false)
    }
  }

  async function markAsPublished(postId: string) {
    await fetch('/api/agents/5/update-post-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, post_id: postId, status: 'published' }),
    })
    setPostStatuses(prev => ({ ...prev, [postId]: 'published' }))
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

  function openBriefingModal(post: Post) {
    setSelectedPost(post)
    setBriefingTab('copy')
    setBriefingError(null)
  }

  function closeBriefingModal() {
    setSelectedPost(null)
    setBriefingError(null)
  }

  // ── Generating calendar state ──────────────────────────────────────────────
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
  const totalBriefed = Object.keys(briefings).length
  const totalPublished = Object.values(postStatuses).filter(s => s === 'published').length

  return (
    <>
      {/* ── Briefing Modal ────────────────────────────────────────────────── */}
      {selectedPost && (
        <div
          onClick={closeBriefingModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0f0f14', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: PLATFORM_COLORS[selectedPost.platform] ?? '#888', fontWeight: 700, fontSize: 14 }}>
                    {PLATFORM_LABELS[selectedPost.platform] ?? selectedPost.platform}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>· {selectedPost.format}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>· {selectedPost.day} {formatDate(selectedPost.date)}</span>
                  <span style={{ background: 'rgba(168,85,247,0.12)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#c084fc' }}>{selectedPost.pillar}</span>
                </div>
                {postStatuses[selectedPost.id] === 'published' && (
                  <span style={{ background: 'rgba(16,185,129,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ Publicado</span>
                )}
              </div>
              <button onClick={closeBriefingModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {generatingBriefing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 200 }}>
                  <div style={{ width: 36, height: 36, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Generando briefing creativo...</p>
                </div>
              ) : briefingError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minHeight: 200, justifyContent: 'center' }}>
                  <p style={{ color: 'var(--siri-pink)', fontSize: 14 }}>⚠️ {briefingError}</p>
                  <button onClick={() => generateBriefing(selectedPost)} className="btn btn-primary" style={{ fontSize: 13 }}>Reintentar</button>
                </div>
              ) : !briefings[selectedPost.id] ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 200, textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>Briefing creativo</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14, maxWidth: 340 }}>
                    Generá instrucciones exactas: qué decir, qué mostrar, cuándo publicar.
                  </p>
                  <button onClick={() => generateBriefing(selectedPost)} className="btn btn-primary">
                    ⚡ Generar briefing
                  </button>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                    {BRIEFING_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setBriefingTab(tab.id)}
                        style={{
                          background: 'none', border: 'none',
                          borderBottom: briefingTab === tab.id ? '2px solid #a855f7' : '2px solid transparent',
                          color: briefingTab === tab.id ? '#a855f7' : 'var(--text-dim)',
                          cursor: 'pointer', fontSize: 13,
                          fontWeight: briefingTab === tab.id ? 600 : 400,
                          padding: '8px 14px', marginBottom: -1, transition: 'all 0.15s',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {briefingTab === 'copy'       && <CopyTab briefing={briefings[selectedPost.id]} />}
                  {briefingTab === 'visual'     && <VisualTab briefing={briefings[selectedPost.id]} />}
                  {briefingTab === 'publishing' && <PublishingTab briefing={briefings[selectedPost.id]} />}
                  {briefingTab === 'tips'       && <TipsTab briefing={briefings[selectedPost.id]} />}
                </>
              )}
            </div>

            {/* Modal footer */}
            {briefings[selectedPost.id] && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
                {postStatuses[selectedPost.id] !== 'published' ? (
                  <button onClick={() => markAsPublished(selectedPost.id)} className="btn btn-primary" style={{ fontSize: 13 }}>
                    Marcar como publicado
                  </button>
                ) : (
                  <span style={{ background: 'rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#34d399', fontWeight: 600 }}>✓ Publicado</span>
                )}
                <button onClick={() => generateBriefing(selectedPost)} className="btn btn-glass" style={{ fontSize: 13 }}>
                  Regenerar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Calendar view ─────────────────────────────────────────────────── */}
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
            { label: 'Briefings listos', value: `${totalBriefed}` },
            { label: 'Publicados', value: `${totalPublished}` },
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
            <span key={p} style={{ background: `${PLATFORM_COLORS[p] ?? '#888'}22`, border: `1px solid ${PLATFORM_COLORS[p] ?? '#888'}55`, borderRadius: 20, padding: '4px 12px', fontSize: 13, color: PLATFORM_COLORS[p] ?? '#888', fontWeight: 600 }}>
              {PLATFORM_LABELS[p] ?? p}
            </span>
          ))}
        </div>

        {/* Weekly accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
          {weeks.map(week => {
            const isOpen = openWeeks.has(week.week)
            const weekBriefedCount = (week.posts ?? []).filter(p => briefings[p.id]).length
            const weekPostCount = week.posts?.length ?? 0

            return (
              <div key={week.week} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleWeek(week.week)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(168,85,247,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>Sem {week.week}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>{week.theme}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{formatDate(week.start_date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {weekBriefedCount > 0 && (
                      <span style={{ background: 'rgba(16,185,129,0.12)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                        {weekBriefedCount}/{weekPostCount} briefings
                      </span>
                    )}
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{weekPostCount} posts</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 18, display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '0 16px 16px' }}>
                    {(week.posts ?? []).map((post, i) => {
                      const color = PLATFORM_COLORS[post.platform] ?? '#888'
                      const hasBriefing = !!briefings[post.id]
                      const isPublished = postStatuses[post.id] === 'published'
                      return (
                        <div
                          key={post.id ?? i}
                          onClick={() => openBriefingModal(post)}
                          style={{ marginTop: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${hasBriefing ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ color, fontSize: 13, fontWeight: 700 }}>{PLATFORM_LABELS[post.platform] ?? post.platform}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>· {post.day} {formatDate(post.date)}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {isPublished && <span style={{ background: 'rgba(16,185,129,0.12)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ Publicado</span>}
                              {hasBriefing && !isPublished && <span style={{ background: 'rgba(168,85,247,0.12)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#c084fc', fontWeight: 600 }}>Briefing listo</span>}
                              <span style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#c084fc' }}>{post.pillar}</span>
                              <span style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: 'var(--text-dim)' }}>{post.format}</span>
                              <span style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#34d399' }}>{post.best_time}</span>
                            </div>
                          </div>

                          <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{post.caption}</p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {(post.hashtags ?? []).slice(0, 4).map((tag, j) => (
                                <span key={j} style={{ color: '#60a5fa', fontSize: 12 }}>{tag}</span>
                              ))}
                              {(post.hashtags ?? []).length > 4 && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>+{post.hashtags.length - 4}</span>}
                            </div>
                            <span style={{ color: hasBriefing ? '#a855f7' : 'var(--text-dim)', fontSize: 12, fontWeight: 500 }}>
                              {hasBriefing ? 'Ver briefing →' : 'Generar briefing →'}
                            </span>
                          </div>
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
    </>
  )
}
