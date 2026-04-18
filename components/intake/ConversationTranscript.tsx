'use client'
import { useEffect, useRef } from 'react'

export interface Turn {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  history: Turn[]
  liveTranscript?: string
}

export function ConversationTranscript({ history, liveTranscript }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, liveTranscript])

  const visible = history.slice(-8)

  return (
    <div style={{
      width: '100%', maxWidth: 560,
      height: 220,
      overflowY: 'auto',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {visible.map((turn, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{
            fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
            color: turn.role === 'assistant' ? '#a855f7' : '#06b6d4',
          }}>
            {turn.role === 'assistant' ? 'Sofía:' : 'Tú:'}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            {turn.content}
          </span>
        </div>
      ))}

      {liveTranscript && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2, color: '#06b6d4' }}>
            Tú:
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontStyle: 'italic' }}>
            {liveTranscript}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
