'use client'

export function ProgressIndicator({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`progress-bar ${i <= current ? 'progress-bar-active' : ''}`}
          style={{ width: 32 }}
        />
      ))}
    </div>
  )
}
