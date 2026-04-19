'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.35)',
    guideUrl: 'https://business.instagram.com',
    guideLabel: 'Ir a Instagram Business ↗',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    color: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
    guideUrl: 'https://facebook.com/pages/create',
    guideLabel: 'Crear página de Facebook ↗',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    icon: '🗺️',
    color: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.3)',
    guideUrl: 'https://business.google.com',
    guideLabel: 'Ir a Google Business ↗',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.3)',
    guideUrl: 'https://www.tiktok.com/signup',
    guideLabel: 'Crear cuenta TikTok ↗',
  },
]

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

interface Props {
  orgId: string
  sessionId: string
  businessBrief: any
}

export function SetupClient({ orgId, sessionId, businessBrief }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawContent, setRawContent] = useState<Record<string, any>>({})
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, string>>>({})
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const businessName = businessBrief?.business_info?.name ?? 'tu negocio'

  const generateContent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/2/generate-profile-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_brief: businessBrief }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { content } = await res.json()
      setRawContent(content)

      const editable: Record<string, Record<string, string>> = {}
      for (const platform of PLATFORMS) {
        editable[platform.id] = {}
        const data = content[platform.id] ?? {}
        for (const field of PLATFORM_FIELDS[platform.id] ?? []) {
          const val = data[field.key]
          editable[platform.id][field.key] = Array.isArray(val) ? val.join(', ') : (val ?? '')
        }
      }
      setEditedContent(editable)
    } catch {
      setError('No se pudo generar el contenido. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [businessBrief])

  useEffect(() => { generateContent() }, [generateContent])

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
    } catch {}
    router.push('/strategy')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Generando contenido optimizado para {businessName}...</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Esto toma unos 20 segundos</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--siri-pink)', fontSize: 16 }}>⚠️ {error}</p>
        <button onClick={generateContent} className="btn btn-primary">Intentar de nuevo</button>
        <button onClick={() => router.push('/dashboard')} className="btn btn-glass">Ir al dashboard</button>
      </div>
    )
  }

  const progressCount = completed.size

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 620 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Optimizá tus <span className="gradient-text">perfiles</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6 }}>
          Generé contenido optimizado para <strong style={{ color: 'white' }}>{businessName}</strong>. Copiá cada sección, actualizá tus perfiles, y marcá como hecho.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-dim)' }}>
          <span>Plataformas revisadas</span>
          <span>{progressCount} / 4</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <div style={{
            height: '100%', width: `${(progressCount / 4) * 100}%`,
            background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
            borderRadius: 4, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Platform cards */}
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {PLATFORMS.map(platform => {
          const isDone = completed.has(platform.id)
          const platformEdited = editedContent[platform.id] ?? {}
          const platformRaw = rawContent[platform.id] ?? {}
          const fields = PLATFORM_FIELDS[platform.id] ?? []

          return (
            <div key={platform.id} style={{
              background: platform.color,
              border: `1px solid ${isDone ? 'rgba(16,185,129,0.5)' : platform.border}`,
              borderRadius: 16, padding: 24,
              display: 'flex', flexDirection: 'column', gap: 18,
              transition: 'border-color 0.3s ease',
            }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{platform.icon}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{platform.name}</h3>
                  {isDone && <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>✓ Listo</span>}
                </div>
                <a
                  href={platform.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none',
                    border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px',
                  }}
                >
                  {platform.guideLabel}
                </a>
              </div>

              {/* Editable fields */}
              {fields.map(field => {
                const value = platformEdited[field.key] ?? ''
                const copyKey = `${platform.id}-${field.key}`
                const overLimit = value.length > field.maxLength

                return (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                        value={value}
                        onChange={e => setEditedContent(prev => ({
                          ...prev,
                          [platform.id]: { ...prev[platform.id], [field.key]: e.target.value },
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
                        type="text"
                        value={value}
                        onChange={e => setEditedContent(prev => ({
                          ...prev,
                          [platform.id]: { ...prev[platform.id], [field.key]: e.target.value },
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

              {/* Google Business extras: secondary categories + attributes */}
              {platform.id === 'google_business' && (
                <>
                  {Array.isArray(platformRaw.secondary_categories) && platformRaw.secondary_categories.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        Categorías secundarias
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {platformRaw.secondary_categories.map((cat: string, i: number) => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(platformRaw.attributes) && platformRaw.attributes.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        Atributos a marcar en Google
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {platformRaw.attributes.map((attr: string, i: number) => (
                          <span key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#6ee7b7' }}>
                            ✓ {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Mark done */}
              <button
                onClick={() => toggleCompleted(platform.id)}
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
          )
        })}
      </div>

      {/* Continue section */}
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 40 }}>
        {progressCount < 4 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
            {progressCount === 0
              ? 'Podés continuar ahora y actualizar los perfiles en otro momento.'
              : `${4 - progressCount} plataforma${4 - progressCount !== 1 ? 's' : ''} pendiente${4 - progressCount !== 1 ? 's' : ''}. Podés continuar igual.`}
          </p>
        )}
        <button
          onClick={handleContinue}
          className="btn btn-primary"
          disabled={saving}
          style={{ fontSize: 16, padding: '14px 48px' }}
        >
          {saving ? 'Guardando...' : progressCount === 4 ? '🎉 Todo listo — Continuar →' : 'Continuar al dashboard →'}
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
