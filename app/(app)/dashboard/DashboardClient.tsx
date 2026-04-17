'use client'
import { useState, useCallback } from 'react'
import { ContentPost } from '@/lib/supabase/types'
import { WeekStrip } from '@/components/dashboard/WeekStrip'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { ContentCard } from '@/components/dashboard/ContentCard'
import { EditModal } from '@/components/dashboard/EditModal'
import { FloatingChat } from '@/components/dashboard/FloatingChat'
import { createClient } from '@/lib/supabase/client'

interface Props { posts: ContentPost[]; orgId: string; orgName: string }

export function DashboardClient({ posts: initialPosts, orgId, orgName }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null)
  const supabase = createClient()

  const pendingPosts = posts.filter(p => p.status === 'pending').sort(
    (a, b) => new Date(a.post_date).getTime() - new Date(b.post_date).getTime()
  )
  const currentPost = pendingPosts[0] ?? null

  const updatePostStatus = useCallback(async (id: string, status: 'approved' | 'skipped') => {
    await supabase.from('content_calendar').update({ status }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }, [supabase])

  const handleSaveEdit = useCallback((updated: ContentPost) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
  }, [])

  const today = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{orgName}</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, textTransform: 'capitalize' }}>{today}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WeekStrip posts={posts} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <StatsBar posts={posts} />

        {currentPost ? (
          <ContentCard
            post={currentPost}
            onApprove={id => updatePostStatus(id, 'approved')}
            onSkip={id => updatePostStatus(id, 'skipped')}
            onEdit={setEditingPost}
          />
        ) : (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>¡Todo al día! 🎉</p>
            <p style={{ color: 'var(--text-dim)' }}>No hay posts pendientes por aprobar.</p>
          </div>
        )}
      </div>

      <EditModal post={editingPost} orgId={orgId} onClose={() => setEditingPost(null)} onSave={handleSaveEdit} />
      <FloatingChat orgId={orgId} />
    </div>
  )
}
