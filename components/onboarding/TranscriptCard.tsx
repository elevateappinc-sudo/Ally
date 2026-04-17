'use client'

export function TranscriptCard({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="glass fade-in" style={{ padding: '16px 20px', maxWidth: 500 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--siri-cyan)', marginBottom: 6 }}>
        TÚ DICES
      </p>
      <p style={{ fontSize: 17, color: 'white', lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}
