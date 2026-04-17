'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export function FloatingChat({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! ¿En qué te puedo ayudar con tu estrategia?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, orgId }),
    })
    const { reply } = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      {open && (
        <div className="glass fade-in" style={{
          position: 'absolute', bottom: 60, right: 0,
          width: 340, height: 440, display: 'flex', flexDirection: 'column',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Sofía ✦</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, var(--siri-blue), var(--siri-purple))'
                  : 'rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text-dim)' }}>
                Escribiendo...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', gap: 8,
          }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Preguntale algo a Sofía..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                padding: '10px 12px', color: 'white', fontSize: 13, outline: 'none' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px', fontSize: 13 }}>
              →
            </button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} style={{
        width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, var(--siri-pink), var(--siri-purple))',
        fontSize: 20, boxShadow: '0 0 20px rgba(191,90,242,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        ✦
      </button>
    </div>
  )
}
