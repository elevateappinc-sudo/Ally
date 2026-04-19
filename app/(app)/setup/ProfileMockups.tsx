'use client'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Avatar({ size = 60, bg = '#333' }: { size?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.3)" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  )
}

function PostGrid({ cols = 3, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2 }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{ aspectRatio: '1', background: `hsl(${220 + i * 15}, 15%, ${20 + i * 3}%)` }} />
      ))}
    </div>
  )
}

// ── Instagram ─────────────────────────────────────────────────────────────────

interface InstagramContent {
  display_name: string
  bio: string
  category: string
}

export function InstagramMockup({ content }: { content: InstagramContent }) {
  const username = (content.display_name || 'tu_negocio')
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '')

  return (
    <div style={{
      background: '#000', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #262626', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: 375, width: '100%',
    }}>
      {/* Top bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #262626' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity={0.6}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>{username}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity={0.6}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </div>

      {/* Profile header */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 86, height: 86, borderRadius: '50%', padding: 3, background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
              <Avatar size={80} bg="#1a1a1a" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center' }}>
            {[['0', 'publicaciones'], ['0', 'seguidores'], ['0', 'seguidos']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{n}</div>
                <div style={{ color: '#a8a8a8', fontSize: 12 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio section */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 2px 0' }}>
            {content.display_name || 'Nombre del negocio'}
          </p>
          {content.category && (
            <p style={{ color: '#a8a8a8', fontSize: 12, margin: '0 0 4px 0' }}>{content.category}</p>
          )}
          <p style={{ color: 'white', fontSize: 13, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>
            {content.bio || 'Tu bio aparecerá aquí...'}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['Editar perfil', 'Compartir perfil', '⊕'].map((btn, i) => (
            <div key={btn} style={{
              flex: i < 2 ? 1 : 0, padding: i === 2 ? '6px 10px' : '6px',
              background: '#262626', borderRadius: 8,
              color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'center',
            }}>{btn}</div>
          ))}
        </div>
      </div>

      {/* Story highlights */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 16px 12px', overflowX: 'hidden' }}>
        {['Destacado 1', 'Destacado 2', 'Destacado 3'].map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1px dashed #333', background: '#111' }} />
            <span style={{ color: '#a8a8a8', fontSize: 11 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
        <div style={{ flex: 1, padding: '10px 0', display: 'flex', justifyContent: 'center', borderBottom: '2px solid white' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div style={{ flex: 1, padding: '10px 0', display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div style={{ flex: 1, padding: '10px 0', display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="2"/></svg>
        </div>
      </div>

      {/* Post grid */}
      <PostGrid cols={3} rows={2} />
    </div>
  )
}

// ── Facebook ──────────────────────────────────────────────────────────────────

interface FacebookContent {
  page_name: string
  short_description: string
  long_description: string
  cta_button: string
}

const CTA_LABELS: Record<string, string> = {
  CONTACT_US: 'Contáctanos',
  CALL_NOW: 'Llamar ahora',
  BOOK_NOW: 'Reservar',
  SHOP_NOW: 'Comprar',
  LEARN_MORE: 'Más información',
}

export function FacebookMockup({ content }: { content: FacebookContent }) {
  const ctaLabel = CTA_LABELS[content.cta_button] ?? content.cta_button ?? 'Contáctanos'

  return (
    <div style={{
      background: '#18191a', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #3a3b3c', fontFamily: 'Helvetica, Arial, sans-serif',
      maxWidth: 375, width: '100%',
    }}>
      {/* Cover photo */}
      <div style={{ height: 140, background: 'linear-gradient(135deg, #1877f2 0%, #0a4fd4 100%)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -28, left: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: 8, border: '3px solid #18191a', background: '#2d2e2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h8"/></svg>
          </div>
        </div>
      </div>

      {/* Name + category */}
      <div style={{ padding: '36px 16px 12px' }}>
        <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 2px 0' }}>
          {content.page_name || 'Nombre de la página'}
        </h2>
        <p style={{ color: '#b0b3b8', fontSize: 13, margin: '0 0 10px 0' }}>Página · Empresa local</p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: '#1877f2', borderRadius: 6, padding: '8px 4px', textAlign: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
            {ctaLabel}
          </div>
          {['Me gusta', '···'].map(b => (
            <div key={b} style={{ flex: b === '···' ? 0 : 1, padding: '8px 12px', background: '#3a3b3c', borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{b}</div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {[['0', 'Me gusta'], ['0', 'seguidores']].map(([n, l]) => (
            <span key={l} style={{ color: '#b0b3b8', fontSize: 13 }}><strong style={{ color: 'white' }}>{n}</strong> {l}</span>
          ))}
        </div>

        {/* Description */}
        <p style={{ color: '#e4e6ea', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          {content.short_description || 'La descripción de tu página aparecerá aquí...'}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#3a3b3c', margin: '0 16px' }} />

      {/* About snippet */}
      <div style={{ padding: '12px 16px' }}>
        <p style={{ color: '#b0b3b8', fontSize: 12, margin: '0 0 6px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Acerca de</p>
        <p style={{ color: '#e4e6ea', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          {content.long_description
            ? content.long_description.slice(0, 120) + (content.long_description.length > 120 ? '...' : '')
            : 'La descripción larga de tu negocio aparecerá aquí.'}
        </p>
      </div>
    </div>
  )
}

// ── Google Business ───────────────────────────────────────────────────────────

interface GoogleBusinessContent {
  description: string
  primary_category: string
  name?: string
  secondary_categories?: string[]
  attributes?: string[]
}

export function GoogleBusinessMockup({ content }: { content: GoogleBusinessContent }) {
  return (
    <div style={{
      background: '#202124', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #3c4043', fontFamily: 'Google Sans, Roboto, sans-serif',
      maxWidth: 375, width: '100%',
    }}>
      {/* Map placeholder */}
      <div style={{ height: 110, background: 'linear-gradient(160deg, #1e3a2f 0%, #2d4a3e 50%, #1a3028 100%)', position: 'relative', overflow: 'hidden' }}>
        {[20, 40, 60, 80].map(p => (
          <div key={`h-${p}`} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        ))}
        {[20, 40, 60, 80].map(p => (
          <div key={`v-${p}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(255,255,255,0.06)' }} />
        ))}
        {/* Pin */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50% 50% 50% 0', background: '#1a73e8', transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', transform: 'rotate(45deg)' }} />
          </div>
        </div>
      </div>

      {/* Business card */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>
          {content.name || 'Tu negocio'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#fbbc04"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            ))}
          </div>
          <span style={{ color: '#fbbc04', fontSize: 13, fontWeight: 600 }}>5.0</span>
          <span style={{ color: '#9aa0a6', fontSize: 13 }}>· 0 reseñas</span>
        </div>
        <p style={{ color: '#9aa0a6', fontSize: 13, margin: '0 0 12px 0' }}>
          {content.primary_category || 'Categoría del negocio'} · Abierto ahora
        </p>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[['Cómo llegar', '🧭'], ['Guardar', '🔖'], ['Compartir', '↗']].map(([l, i]) => (
            <div key={l} style={{ flex: 1, background: '#303134', borderRadius: 20, padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 14 }}>{i}</div>
              <div style={{ color: '#8ab4f8', fontSize: 11, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ borderTop: '1px solid #3c4043', paddingTop: 12, marginBottom: 8 }}>
          <p style={{ color: '#e8eaed', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {content.description
              ? content.description.slice(0, 180) + (content.description.length > 180 ? '...' : '')
              : 'La descripción de tu negocio en Google aparecerá aquí.'}
          </p>
        </div>

        {/* Attributes */}
        {(content.attributes ?? []).length > 0 && (
          <div style={{ borderTop: '1px solid #3c4043', paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(content.attributes ?? []).slice(0, 3).map((a, i) => (
                <span key={i} style={{ background: '#303134', borderRadius: 16, padding: '4px 10px', fontSize: 12, color: '#9aa0a6' }}>✓ {a}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TikTok ────────────────────────────────────────────────────────────────────

interface TikTokContent {
  display_name: string
  bio: string
  category: string
}

export function TikTokMockup({ content }: { content: TikTokContent }) {
  const username = (content.display_name || 'tunegocio')
    .toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.]/g, '')

  return (
    <div style={{
      background: '#000', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #161823', fontFamily: 'ProximaNova, Helvetica, sans-serif',
      maxWidth: 375, width: '100%',
    }}>
      {/* Top bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity={0.6}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>@{username}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity={0.6}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </div>

      {/* Profile section */}
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'linear-gradient(135deg, #ff0050, #00f2ea)', padding: 2 }}>
            <Avatar size={88} bg="#1a1a2e" />
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#fe2c55', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 14, lineHeight: 1 }}>+</span>
          </div>
        </div>

        <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 2px 0' }}>
          {content.display_name || 'Tu negocio'}
        </p>
        <p style={{ color: '#888', fontSize: 13, margin: '0 0 10px 0' }}>@{username}</p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
          {[['0', 'Siguiendo'], ['0', 'Seguidores'], ['0', 'Me gusta']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 17, margin: '0 0 2px 0' }}>{n}</p>
              <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{l}</p>
            </div>
          ))}
        </div>

        <p style={{ color: 'white', fontSize: 13, lineHeight: 1.5, margin: '0 0 14px 0', maxWidth: 280 }}>
          {content.bio || 'Tu bio de TikTok aparecerá aquí...'}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <div style={{ flex: 1, background: '#fe2c55', borderRadius: 4, padding: '8px', textAlign: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>Seguir</div>
          <div style={{ flex: 1, background: 'transparent', border: '1px solid #333', borderRadius: 4, padding: '8px', textAlign: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>Mensaje</div>
          <div style={{ background: 'transparent', border: '1px solid #333', borderRadius: 4, padding: '8px 10px', color: 'white', fontSize: 14 }}>⋯</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #161823' }}>
        {[
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, active: true },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M4 6h16M4 10h16M4 14h8"/></svg>, active: false },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>, active: false },
        ].map(({ icon, active }, i) => (
          <div key={i} style={{
            flex: 1, padding: '10px 0', display: 'flex', justifyContent: 'center',
            borderBottom: active ? '2px solid white' : '2px solid transparent',
          }}>
            {icon}
          </div>
        ))}
      </div>

      {/* Video grid */}
      <PostGrid cols={3} rows={2} />
    </div>
  )
}
