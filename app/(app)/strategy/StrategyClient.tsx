'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orgId: string
  sessionId: string
  businessBrief: any
  initialStrategy: any | null
}

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'posicionamiento', label: 'Posicionamiento' },
  { id: 'voz', label: 'Voz de Marca' },
  { id: 'pilares', label: 'Pilares' },
  { id: 'keywords', label: 'Keywords & Hashtags' },
]

export function StrategyClient({ orgId, sessionId, businessBrief, initialStrategy }: Props) {
  const router = useRouter()
  const [strategy, setStrategy] = useState<any>(initialStrategy)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Iniciando...')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resumen')
  const [generating, setGenerating] = useState(!initialStrategy)
  const startedRef = useRef(false)

  useEffect(() => {
    if (initialStrategy || startedRef.current) return
    startedRef.current = true
    generateStrategy()
  }, [])

  async function generateStrategy() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/3/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, session_id: sessionId, business_brief: businessBrief }),
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
              setStrategy(evt.strategy)
              setProgress(100)
              setGenerating(false)
            } else if (evt.type === 'error') {
              throw new Error(evt.message)
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error generando estrategia')
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Construyendo tu estrategia de marca</p>
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
        <button onClick={generateStrategy} className="btn btn-primary">Intentar de nuevo</button>
        <button onClick={() => router.push('/home')} className="btn btn-glass">Ir al inicio</button>
      </div>
    )
  }

  if (!strategy) return null

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Estrategia de Marca</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>{businessBrief?.business_info?.name ?? 'Tu negocio'}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #a855f7' : '2px solid transparent',
              color: activeTab === tab.id ? '#a855f7' : 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              padding: '10px 16px',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'resumen' && <ResumenTab strategy={strategy} />}
      {activeTab === 'posicionamiento' && <PosicionamientoTab strategy={strategy} />}
      {activeTab === 'voz' && <VozTab strategy={strategy} />}
      {activeTab === 'pilares' && <PilaresTab strategy={strategy} />}
      {activeTab === 'keywords' && <KeywordsTab strategy={strategy} />}

      <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/calendar')} className="btn btn-primary">
          Crear calendario →
        </button>
        <button onClick={() => router.push('/home')} className="btn btn-glass" style={{ fontSize: 13 }}>
          Ir al dashboard
        </button>
        <button onClick={generateStrategy} className="btn btn-glass" style={{ fontSize: 13 }}>
          Regenerar estrategia
        </button>
      </div>
    </div>
  )
}

// ── Tab components ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>{children}</p>
}

function TagList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(items ?? []).map((item, i) => (
        <span key={i} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#c084fc' }}>{item}</span>
      ))}
    </div>
  )
}

function ResumenTab({ strategy }: { strategy: any }) {
  const exec = strategy.executive_summary ?? {}
  const comp = (strategy.competitive_analysis ?? []) as any[]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Conclusión principal</SectionTitle>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.6 }}>{exec.main_insight}</p>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Mayor oportunidad</SectionTitle>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{exec.biggest_opportunity}</p>
        </Card>
        <Card>
          <SectionTitle>Foco próximos 90 días</SectionTitle>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{exec.recommended_focus}</p>
        </Card>
      </div>
      {(exec.success_metrics ?? []).length > 0 && (
        <Card>
          <SectionTitle>Métricas de éxito</SectionTitle>
          <ul style={{ margin: 0, padding: '0 0 0 18px', color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.8 }}>
            {exec.success_metrics.map((m: string, i: number) => <li key={i}>{m}</li>)}
          </ul>
        </Card>
      )}
      {comp.length > 0 && (
        <Card>
          <SectionTitle>Análisis competitivo</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comp.map((c: any, i: number) => (
              <div key={i} style={{ borderLeft: '3px solid rgba(168,85,247,0.4)', paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>{c.name}</span>
                  <span style={{ background: 'rgba(168,85,247,0.15)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#c084fc' }}>{c.pricing_tier}</span>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 6 }}>{c.positioning}</p>
                <p style={{ color: '#86efac', fontSize: 13 }}>→ {c.opportunity}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function PosicionamientoTab({ strategy }: { strategy: any }) {
  const pos = strategy.positioning ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Declaración de posicionamiento</SectionTitle>
        <p style={{ color: '#c084fc', fontSize: 17, fontStyle: 'italic', lineHeight: 1.6, fontWeight: 500 }}>"{pos.statement}"</p>
      </Card>
      <Card>
        <SectionTitle>Audiencia objetivo</SectionTitle>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6 }}>{pos.target_audience}</p>
      </Card>
      <Card>
        <SectionTitle>Propuesta de valor</SectionTitle>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6 }}>{pos.value_proposition}</p>
      </Card>
      {(pos.key_differentiators ?? []).length > 0 && (
        <Card>
          <SectionTitle>Diferenciadores clave</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pos.key_differentiators.map((d: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>✦</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function VozTab({ strategy }: { strategy: any }) {
  const voice = strategy.brand_voice ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Arquetipo</SectionTitle>
        <p style={{ color: '#c084fc', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{voice.archetype}</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5 }}>{voice.archetype_description}</p>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Atributos de tono</SectionTitle>
          <TagList items={voice.tone_attributes ?? []} />
        </Card>
        <Card>
          <SectionTitle>Configuración</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-dim)' }}>Formalidad</span>
              <span style={{ color: 'var(--text-primary)' }}>{voice.formality}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-dim)' }}>Emojis</span>
              <span style={{ color: 'var(--text-primary)' }}>{voice.emoji_usage}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-dim)' }}>Términos técnicos</span>
              <span style={{ color: 'var(--text-primary)' }}>{voice.technical_terms}</span>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>✅ Sí decir</SectionTitle>
          <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.8 }}>
            {(voice.do_say ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
          </ul>
        </Card>
        <Card>
          <SectionTitle>❌ No decir</SectionTitle>
          <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.8 }}>
            {(voice.dont_say ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
          </ul>
        </Card>
      </div>
      {strategy.visual_guidelines && (
        <Card>
          <SectionTitle>Lineamientos visuales</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 6 }}>Paleta de colores</p>
              <TagList items={strategy.visual_guidelines.color_palette ?? []} />
            </div>
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4 }}>Estilo fotográfico</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13 }}>{strategy.visual_guidelines.photography_style}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4 }}>Estética general</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13 }}>{strategy.visual_guidelines.aesthetic}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function PilaresTab({ strategy }: { strategy: any }) {
  const pillars: any[] = strategy.content_pillars ?? []
  const messages = strategy.key_messages ?? {}
  const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {pillars.map((p: any, i: number) => (
          <Card key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: colors[i % colors.length], fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              <span style={{ background: `${colors[i % colors.length]}22`, borderRadius: 20, padding: '2px 10px', fontSize: 13, color: colors[i % colors.length], fontWeight: 600 }}>{p.percentage}%</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>{p.purpose}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(p.example_topics ?? []).map((t: string, j: number) => (
                <span key={j} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: 'var(--text-dim)' }}>{t}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {messages.primary && (
        <Card>
          <SectionTitle>Mensaje principal</SectionTitle>
          <p style={{ color: '#c084fc', fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>{messages.primary}</p>
          {(messages.secondary ?? []).length > 0 && (
            <>
              <SectionTitle>Mensajes secundarios</SectionTitle>
              <ul style={{ margin: '0 0 12px 0', padding: '0 0 0 16px', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.8 }}>
                {messages.secondary.map((m: string, i: number) => <li key={i}>{m}</li>)}
              </ul>
            </>
          )}
          {(messages.proof_points ?? []).length > 0 && (
            <>
              <SectionTitle>Evidencias de respaldo</SectionTitle>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.8 }}>
                {messages.proof_points.map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

function KeywordsTab({ strategy }: { strategy: any }) {
  const kw = strategy.keywords ?? {}
  const ht = strategy.hashtags ?? {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Keywords primarias</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(kw.primary ?? []).map((k: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(168,85,247,0.08)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, flex: 1 }}>{k.keyword}</span>
              <span style={{ fontSize: 11, color: k.priority === 'high' ? '#86efac' : k.priority === 'medium' ? '#fbbf24' : 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>{k.priority}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{(k.where_to_use ?? []).join(', ')}</span>
            </div>
          ))}
        </div>
      </Card>
      {(kw.secondary ?? []).length > 0 && (
        <Card>
          <SectionTitle>Keywords secundarias</SectionTitle>
          <TagList items={kw.secondary} />
        </Card>
      )}
      {(kw.location ?? []).length > 0 && (
        <Card>
          <SectionTitle>Keywords de ubicación</SectionTitle>
          <TagList items={kw.location} />
        </Card>
      )}
      <Card>
        <SectionTitle>Hashtags de marca</SectionTitle>
        <TagList items={ht.branded ?? []} />
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Hashtags grandes (nicho)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(ht.large_niche ?? []).map((h: any, i: number) => (
              <div key={i}>
                <span style={{ color: '#c084fc', fontSize: 14, fontWeight: 600 }}>{h.tag}</span>
                <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '2px 0 0 0' }}>{h.why}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Hashtags medianos (nicho)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(ht.medium_niche ?? []).map((h: any, i: number) => (
              <div key={i}>
                <span style={{ color: '#c084fc', fontSize: 14, fontWeight: 600 }}>{h.tag}</span>
                <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '2px 0 0 0' }}>{h.why}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {(ht.local ?? []).length > 0 && (
        <Card>
          <SectionTitle>Hashtags locales</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {ht.local.map((h: any, i: number) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{h.tag}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>{h.why}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {ht.usage_formula && (
        <Card style={{ background: 'rgba(168,85,247,0.08)' }}>
          <SectionTitle>Fórmula de uso</SectionTitle>
          <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 600 }}>{ht.usage_formula}</p>
        </Card>
      )}
    </div>
  )
}
