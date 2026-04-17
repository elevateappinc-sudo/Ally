'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  org: any; members: any[]; orgId: string; userId: string
}

export function SettingsClient({ org, members: initialMembers, orgId, userId }: Props) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('org_invitations').insert({
      org_id: orgId, invited_email: inviteEmail, role: inviteRole,
      token, expires_at: expiresAt, created_by: userId,
    })

    if (!error) {
      setMessage(`Invitación guardada. Comparte este link: ${window.location.origin}/invite/${token}`)
    } else {
      setMessage('Error al crear invitación')
    }
    setSending(false)
    setInviteEmail('')
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Configuración</h1>

      <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Miembros del equipo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {initialMembers.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{m.user_id === userId ? 'Tú' : m.user_id}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20 }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Invitar miembro</h3>
        <form onSubmit={sendInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            type="email" placeholder="email@ejemplo.com" required
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '12px 14px', color: 'white', fontSize: 14, outline: 'none' }} />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 14, outline: 'none' }}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={sending}>Invitar</button>
        </form>
        {message && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--siri-cyan)' }}>{message}</p>}
      </div>
    </div>
  )
}
