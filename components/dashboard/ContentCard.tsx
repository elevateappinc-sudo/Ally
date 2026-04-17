'use client'
import { useSwipeable } from 'react-swipeable'
import { ContentPost } from '@/lib/supabase/types'

interface Props {
  post: ContentPost
  onApprove: (id: string) => void
  onSkip: (id: string) => void
  onEdit: (post: ContentPost) => void
}

const pillarColors: Record<string, string> = {
  education: 'var(--siri-cyan)',
  behind_scenes: 'var(--siri-purple)',
  social_proof: 'var(--siri-pink)',
  sales: '#FF9F0A',
}

const pillarLabels: Record<string, string> = {
  education: 'Educación',
  behind_scenes: 'Detrás de escena',
  social_proof: 'Prueba social',
  sales: 'Ventas',
}

export function ContentCard({ post, onApprove, onSkip, onEdit }: Props) {
  const handlers = useSwipeable({
    onSwipedRight: () => onApprove(post.id),
    onSwipedLeft: () => onSkip(post.id),
    trackMouse: true,
  })

  const formattedDate = new Date(post.post_date + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div {...handlers} className="glass" style={{ padding: 24, userSelect: 'none' }}>
      {/* Meta */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: `${pillarColors[post.pillar]}20`, color: pillarColors[post.pillar],
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {pillarLabels[post.pillar]}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {post.post_type}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dimmer)' }}>
          {formattedDate} · {post.best_time}
        </span>
      </div>

      {/* Caption */}
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', marginBottom: 12 }}>
        {post.caption}
      </p>

      {/* Visual brief */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
        padding: '10px 14px', marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, color: 'var(--siri-cyan)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
          Visual
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{post.visual_brief}</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onApprove(post.id)} className="btn btn-primary" style={{ flex: 1 }}>
          ✓ Aprobar
        </button>
        <button onClick={() => onEdit(post)} className="btn btn-glass" style={{ padding: '14px 18px' }}>
          ✏️ Editar
        </button>
        <button onClick={() => onSkip(post.id)} className="btn btn-glass" style={{ padding: '14px 18px', color: 'var(--text-dimmer)' }}>
          Saltar
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dimmer)', marginTop: 12 }}>
        ← deslizá para saltar · deslizá para aprobar →
      </p>
    </div>
  )
}
