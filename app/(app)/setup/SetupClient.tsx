'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import {
  InstagramMockup,
  FacebookMockup,
  GoogleBusinessMockup,
  TikTokMockup,
} from './ProfileMockups'

// ── Types ─────────────────────────────────────────────────────────────────────

type SetupStep = 'analyzing' | 'recommendation' | 'generating' | 'optimizing'

interface PlatformAnalysis {
  recommended_platforms: string[]
  reasoning: Record<string, string>
  sofia_message: string
}

// ── Platform metadata ─────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, {
  name: string
  color: string
  border: string
  guideUrl: string
  guideLabel: string
  logo: React.ReactNode
}> = {
  instagram: {
    name: 'Instagram',
    color: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.35)',
    guideUrl: 'https://business.instagram.com',
    guideLabel: 'Ir a Instagram Business ↗',
    logo: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="ig-logo" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-logo)"/>
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    color: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
    guideUrl: 'https://facebook.com/pages/create',
    guideLabel: 'Crear página de Facebook ↗',
    logo: (
      <svg width="28" height="28" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#1877f2"/>
        <path d="M16.5 8H14c-.5 0-1 .5-1 1v2h3.5l-.5 3H13v7h-3v-7H8v-3h2V9c0-2.2 1.8-4 4-4h2.5v3z" fill="white"/>
      </svg>
    ),
  },
  google_business: {
    name: 'Google Business',
    color: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.3)',
    guideUrl: 'https://business.google.com',
    guideLabel: 'Ir a Google Business ↗',
    logo: (
      <svg width="28" height="28" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="white"/>
        <path d="M21.8 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.5c-.2 1.2-1 2.3-2.1 3v2.5h3.4c2-1.8 3-4.5 3-7.3z" fill="#4285f4"/>
        <path d="M12 22c2.7 0 5-1 6.8-2.5l-3.4-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H2.9v2.6C4.7 19.8 8.1 22 12 22z" fill="#34a853"/>
        <path d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.5-2.6z" fill="#fbbc05"/>
        <path d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.8 14.7 2 12 2 8.1 2 4.7 4.2 2.9 7.6l3.5 2.6C7.2 7.6 9.4 5.8 12 5.8z" fill="#ea4335"/>
      </svg>
    ),
  },
  tiktok: {
    name: 'TikTok',
    color: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.3)',
    guideUrl: 'https://www.tiktok.com/signup',
    guideLabel: 'Crear cuenta TikTok ↗',
    logo: (
      <svg width="28" height="28" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#010101"/>
        <path d="M17 8.5c-.9-.6-1.6-1.6-1.8-2.7h-2v9.8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.1V11.5c-.2 0-.4-.1-.6-.1-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V10.1c.8.5 1.7.9 2.8.9V9c-.3 0-.6-.2-.8-.5V8.5z" fill="white"/>
      </svg>
    ),
  },
}

const PLATFORM_FIELDS: Record<string, { key: string; label: string; maxLength: number; multiline: boolean }[]> = {
  instagram: [
    { key: 'display_name', label: 'Nombre del perfil', maxLength: 30, multiline: false },
    { key: 'bio', label: 'Bio', maxLength: 150, multiline: true },
    { key: 'category', label: 'Categoría', maxLength: 80, multiline: false },
  ],
  facebook: [
    { key: 'page_name', label: 'Nombre de la página', maxLength: 75, multiline: false },
    { key: 'short_description', label: 'Descripción corta', maxLength: 255, multiline: true },
    { key: 'long_description', label: 'Descripción larga', maxLength: 500, multiline: true },
    { key: 'cta_button', label: 'Botón de acción', maxLength: 20, multiline: false },
  ],
  google_business: [
    { key: 'description', label: 'Descripción del negocio', maxLength: 750, multiline: true },
    { key: 'primary_category', label: 'Categoría principal', maxLength: 100, multiline: false },
  ],
  tiktok: [
    { key: 'display_name', label: 'Nombre', maxLength: 30, multiline: false },
    { key: 'bio', label: 'Bio', maxLength: 80, multiline: true },
    { key: 'category', label: 'Categoría', maxLength: 80, multiline: false },
  ],
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  orgId: string
  sessionId: string
  businessBrief: any
}

// ── Main component ────────────────────────────────────────────────────────────

export function SetupClient({ orgId, sessionId, businessBrief }: Props) {
  const router = useRouter()
  const { speak } = useSpeechSynthesis()

  const [step, setStep] = useState<SetupStep>('analyzing')
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PlatformAnalysis | null>(null)
  const [rawContent, setRawContent] = useState<Record<string, any>>({})
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, string>>>({})
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [sofiaSpoken, setSofiaSpoken] = useState(false)

  const businessName = businessBrief?.business_info?.name ?? 'tu negocio'
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    analyzePlatforms()
  }, [])

  useEffect(() => {
    if (step === 'recommendation' && analysis?.sofia_message && !sofiaSpoken) {
      setSofiaSpoken(true)
      speak(analysis.sofia_message)
    }
  }, [step, analysis, sofiaSpoken, speak])

  const analyzePlatforms = async () => {
    setStep('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/agents/2/analyze-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_brief: businessBrief }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data: PlatformAnalysis = await res.json()
      setAnalysis(data)
      setStep('recommendation')
    } catch {
      setError('No se pudo analizar tu presencia digital. Intentá de nuevo.')
    }
  }

  const handleProceedToGeneration = async () => {
    if (!analysis) return
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/agents/2/generate-profile-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_brief: businessBrief,
          platforms: analysis.recommended_platforms,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { content } = await res.json()
      setRawContent(content)

      const editable: Record<string, Record<string, string>> = {}
      for (const platformId of analysis.recommended_platforms) {
        editable[platformId] = {}
        const data = content[platformId] ?? {}
        for (const field of PLATFORM_FIELDS[platformId] ?? []) {
          const val = data[field.key]
          editable[platformId][field.key] = Array.isArray(val) ? val.join(', ') : (val ?? '')
        }
      }
      setEditedContent(editable)
      setStep('optimizing')
    } catch {
      setError('No se pudo generar el contenido. Intentá de nuevo.')
    }
  }

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const toggleCompleted = (platformId: string) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(platformId)) next.delete(platformId)
      else next.add(platformId)
      return next
    })
  }

  const handleContinue = async () => {
    setSaving(true)
    try {
      await fetch('/api/agents/2/save-setup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          session_id: sessionId,
          completed_platforms: Array.from(completed),
          optimized_content: editedContent,
        }),
      })
  } catch (err) {
    console.error('[SetupClient] save-setup-status failed:', err)
  } finally {
    setSaving(false)
  }
  router.push('/strategy')
}

  // ── analyzing ───────────────────────────────────────────────────────────────

  if (step === 'analyzing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Analizando tu presencia digital...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Sofía está eligiendo las mejores plataformas para {businessName}</p>
      </div>
    )
  }

  // ── error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--siri-pink)', fontSize: 16 }}>⚠️ {error}</p>
        <button onClick={analyzePlatforms} className="btn btn-primary">Intentar de nuevo</button>
        <button onClick={() => router.push('/dashboard')} className="btn btn-glass">Ir al dashboard</button>
      </div>
    )
  }

  // ── recommendation ──────────────────────────────────────────────────────────

  if (step === 'recommendation' && analysis) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>Sofía analizó tu negocio</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 0 }}>
            Tu <span className="gradient-text">presencia digital</span>
          </h1>
        </div>

        {/* Sofía bubble */}
        <div style={{
          maxWidth: 540, width: '100%',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.08))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 16, padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🤖</div>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
              {analysis.sofia_message}
            </p>
          </div>
        </div>

        {/* Platform cards */}
        <div style={{ maxWidth: 540, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analysis.recommended_platforms.map(platformId => {
            const meta = PLATFORM_META[platformId]
            if (!meta) return null
            return (
              <div key={platformId} style={{
                background: meta.color,
                border: `1px solid ${meta.border}`,
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ flexShrink: 0 }}>{meta.logo}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 3px 0' }}>{meta.name}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0, lineHeight: 1.45 }}>
                    {analysis.reasoning[platformId] ?? ''}
                  </p>
                </div>
                <span style={{ color: '#34d399', fontSize: 18, flexShrink: 0 }}>✓</span>
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={handleProceedToGeneration} className="btn btn-primary" style={{ fontSize: 15, padding: '13px 36px' }}>
            Ya las tengo — optimizar perfiles ✓
          </button>
          <button onClick={handleProceedToGeneration} className="btn btn-glass" style={{ fontSize: 15, padding: '13px 36px' }}>
            Las voy a crear →
          </button>
        </div>
      </div>
    )
  }

  // ── generating ──────────────────────────────────────────────────────────────

  if (step === 'generating') {
    const count = analysis?.recommended_platforms.length ?? 0
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Generando tu contenido optimizado para {count} plataforma{count !== 1 ? 's' : ''}...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Esto toma unos 20 segundos</p>
      </div>
    )
  }

  // ── optimizing ──────────────────────────────────────────────────────────────

  if (step !== 'optimizing' || !analysis) return null

  const platforms = analysis.recommended_platforms
  const progressCount = completed.size
  const total = platforms.length

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

      <div style={{ textAlign: 'center', maxWidth: 720 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Optimizá tus <span className="gradient-text">perfiles</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6 }}>
          Generé contenido optimizado para <strong style={{ color: 'white' }}>{businessName}</strong>. Editá, copiá y actualizá cada perfil.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-dim)' }}>
          <span>Plataformas revisadas</span>
          <span>{progressCount} / {total}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <div style={{
            height: '100%', width: `${(progressCount / total) * 100}%`,
            background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
            borderRadius: 4, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Platform cards */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {platforms.map(platformId => {
          const meta = PLATFORM_META[platformId]
          if (!meta) return null
          const isDone = completed.has(platformId)
          const platformEdited = editedContent[platformId] ?? {}
          const platformRaw = rawContent[platformId] ?? {}
          const fields = PLATFORM_FIELDS[platformId] ?? []

          return (
            <div key={platformId} style={{
              background: meta.color,
              border: `1px solid ${isDone ? 'rgba(16,185,129,0.5)' : meta.border}`,
              borderRadius: 16, padding: 24,
              transition: 'border-color 0.3s ease',
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {meta.logo}
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{meta.name}</h3>
                  {isDone && <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>✓ Listo</span>}
                </div>
                <a
                  href={meta.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px' }}
                >
                  {meta.guideLabel}
                </a>
              </div>

              {/* Split layout: fields left, mockup right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {fields.map(field => {
                    const value = platformEdited[field.key] ?? ''
                    const copyKey = `${platformId}-${field.key}`
                    const overLimit = value.length > field.maxLength

                    return (
                      <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor={`${platformId}-${field.key}`} style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {field.label}
                          </label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: overLimit ? '#f87171' : 'var(--text-dim)' }}>
                              {value.length}/{field.maxLength}
                            </span>
                            <button
                              onClick={() => handleCopy(value, copyKey)}
                              style={{
                                background: copied === copyKey ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--border)', borderRadius: 6,
                                padding: '3px 10px', fontSize: 12,
                                color: copied === copyKey ? '#34d399' : 'var(--text-dim)', cursor: 'pointer',
                              }}
                            >
                              {copied === copyKey ? '✓ Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        {field.multiline ? (
                          <textarea
                            id={`${platformId}-${field.key}`}
                            value={value}
                            onChange={e => setEditedContent(prev => ({
                              ...prev,
                              [platformId]: { ...prev[platformId], [field.key]: e.target.value },
                            }))}
                            rows={field.maxLength > 300 ? 5 : 3}
                            style={{
                              width: '100%', background: 'rgba(0,0,0,0.25)',
                              border: `1px solid ${overLimit ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                              borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14,
                              outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55,
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <input
                            id={`${platformId}-${field.key}`}
                            type="text"
                            value={value}
                            onChange={e => setEditedContent(prev => ({
                              ...prev,
                              [platformId]: { ...prev[platformId], [field.key]: e.target.value },
                            }))}
                            style={{
                              width: '100%', background: 'rgba(0,0,0,0.25)',
                              border: `1px solid ${overLimit ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                              borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 14,
                              outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Google Business extras */}
                  {platformId === 'google_business' && (
                    <>
                      {Array.isArray(platformRaw.secondary_categories) && platformRaw.secondary_categories.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Categorías secundarias</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {platformRaw.secondary_categories.map((cat: string, i: number) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>{cat}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(platformRaw.attributes) && platformRaw.attributes.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Atributos a marcar en Google</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {platformRaw.attributes.map((attr: string, i: number) => (
                              <span key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#6ee7b7' }}>✓ {attr}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => toggleCompleted(platformId)}
                    style={{
                      alignSelf: 'flex-start',
                      background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '8px 18px',
                      color: isDone ? '#34d399' : 'var(--text-dim)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    }}
                  >
                    {isDone ? '✓ Marcado como hecho' : 'Marcar como hecho'}
                  </button>
                </div>

                {/* Live mockup */}
                <div style={{ position: 'sticky', top: 20 }}>
                  {platformId === 'instagram' && (
                    <InstagramMockup content={{
                      display_name: platformEdited.display_name ?? '',
                      bio: platformEdited.bio ?? '',
                      category: platformEdited.category ?? '',
                    }} />
                  )}
                  {platformId === 'facebook' && (
                    <FacebookMockup content={{
                      page_name: platformEdited.page_name ?? '',
                      short_description: platformEdited.short_description ?? '',
                      long_description: platformEdited.long_description ?? '',
                      cta_button: platformEdited.cta_button ?? '',
                    }} />
                  )}
                  {platformId === 'google_business' && (
                    <GoogleBusinessMockup content={{
                      name: businessName,
                      description: platformEdited.description ?? '',
                      primary_category: platformEdited.primary_category ?? '',
                      secondary_categories: platformRaw.secondary_categories,
                      attributes: platformRaw.attributes,
                    }} />
                  )}
                  {platformId === 'tiktok' && (
                    <TikTokMockup content={{
                      display_name: platformEdited.display_name ?? '',
                      bio: platformEdited.bio ?? '',
                      category: platformEdited.category ?? '',
                    }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 40 }}>
        {progressCount < total && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
            {progressCount === 0
              ? 'Podés continuar ahora y actualizar los perfiles en otro momento.'
              : `${total - progressCount} plataforma${total - progressCount !== 1 ? 's' : ''} pendiente${total - progressCount !== 1 ? 's' : ''}. Podés continuar igual.`}
          </p>
        )}
        <button
          onClick={handleContinue}
          className="btn btn-primary"
          disabled={saving}
          style={{ fontSize: 16, padding: '14px 48px' }}
        >
          {saving ? 'Guardando...' : progressCount === total ? '🎉 Todo listo — Continuar →' : 'Continuar →'}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}
        >
          Saltar por ahora
        </button>
      </div>

    </div>
  )
}
