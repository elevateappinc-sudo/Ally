'use client'
import { useState } from 'react'
import { ContentPost } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  post: ContentPost | null
  orgId: string
  onClose: () => void
  onSave: (updated: ContentPost) => void
}

export function EditModal({ post, orgId, onClose, onSave }: Props) {
  const [caption, setCaption] = useState(post?.caption ?? '')
  const [visualBrief, setVisualBrief] = useState(post?.visual_brief ?? '')
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') ?? '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!post) return null

  async function handleSave() {
    setLoading(true)
    const hashtagArray = hashtags.split(/\s+/).filter(h => h.startsWith('#'))
    const { data, error } = await supabase
      .from('content_calendar')
      .update({ caption, visual_brief: visualBrief, hashtags: hashtagArray })
      .eq('id', post!.id)
      .select().single()
    setLoading(false)
    if (!error && data) onSave(data as ContentPost)
    onClose()
  }

  async function handleRegenerate() {
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        message: `Regenera el caption para un post de tipo "${post!.post_type}" sobre "${post!.pillar}". Visual brief: ${post!.visual_brief}. Devuelve solo el caption nuevo, sin explicaciones.`,
      }),
    })
    const { reply } = await res.json()
    if (reply) setCaption(reply)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, zIndex: 100,
    }} onClick={onClose}>
      <div className="glass" style={{ width: '100%', maxWidth: 560, padding: 32 }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Editar post</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Caption</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Brief visual</label>
            <textarea value={visualBrief} onChange={e => setVisualBrief(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Hashtags</label>
            <input value={hashtags} onChange={e => setHashtags(e.target.value)}
              placeholder="#marketing #emprendimiento" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={handleRegenerate} className="btn btn-glass" disabled={loading}>
            ✨ Regenerar
          </button>
          <button onClick={onClose} className="btn btn-glass" style={{ color: 'var(--text-dimmer)' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '12px 14px', color: 'white', fontSize: 14, outline: 'none',
}
