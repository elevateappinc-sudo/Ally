'use client'

interface ServiceCardProps {
  id: 'agency' | 'tools'
  title: string
  tagline: string
  accent: string
  icon: string
  features: string[]
  highlight: string
  selected: boolean
  onSelect: () => void
}

function ServiceCard({ title, tagline, accent, icon, features, highlight, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        flex: 1,
        minWidth: 260,
        maxWidth: 360,
        background: selected
          ? `linear-gradient(135deg, ${accent}22, ${accent}11)`
          : 'var(--bg-card)',
        border: `2px solid ${selected ? accent : 'var(--border)'}`,
        borderRadius: 20,
        padding: 28,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: accent, borderRadius: '50%',
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>✓</div>
      )}

      <div style={{ fontSize: 36 }}>{icon}</div>

      <div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 14, color: accent, fontWeight: 500 }}>{tagline}</p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-dim)' }}>
            <span style={{ color: accent, marginTop: 1, flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{
        marginTop: 'auto',
        background: `${accent}18`,
        border: `1px solid ${accent}44`,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        color: accent,
        fontWeight: 500,
      }}>
        {highlight}
      </div>
    </button>
  )
}

interface Props {
  selected: 'agency' | 'tools' | null
  onSelect: (value: 'agency' | 'tools') => void
}

export function ServiceSelector({ selected, onSelect }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 760,
    }}>
      <ServiceCard
        id="agency"
        title="Agencia de Marketing"
        tagline="Sofía gestiona tu marketing por vos"
        accent="var(--siri-purple, #a855f7)"
        icon="🚀"
        features={[
          'Diagnóstico & definición de audiencia',
          'Investigación de mercado personalizada',
          'Análisis detallado de competencia',
          'Plan de canales & crecimiento',
          'Estrategia de contenido & activación',
          'Gestión & automatización',
          'Reporting & optimización mensual',
        ]}
        highlight="Sin contratar community manager. Estrategia profesional a fracción del costo."
        selected={selected === 'agency'}
        onSelect={() => onSelect('agency')}
      />

      <ServiceCard
        id="tools"
        title="Herramientas de Marketing"
        tagline="Vos tenés el control, con IA de tu lado"
        accent="var(--siri-cyan, #06b6d4)"
        icon="⚡"
        features={[
          'Catálogos de estrategias listas para usar',
          'Centro de contenidos todo en un lugar',
          'Publicación automática donde definas',
          'Sugerencias de IA personalizadas',
          'Analytics de cómo funcionan tus estrategias',
        ]}
        highlight="Ideal si querés manejar tu marketing vos mismo, con herramientas poderosas."
        selected={selected === 'tools'}
        onSelect={() => onSelect('tools')}
      />
    </div>
  )
}
