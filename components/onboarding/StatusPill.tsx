'use client'
import { OrbState } from './VoiceOrb'

const labels: Record<OrbState, string> = {
  idle: 'Activar micrófono',
  listening: 'Escuchando',
  speaking: 'Sofía hablando',
  thinking: 'Procesando',
}

const colors: Record<OrbState, string> = {
  idle: 'var(--siri-cyan)',
  listening: 'var(--siri-blue)',
  speaking: 'var(--siri-purple)',
  thinking: 'var(--siri-pink)',
}

export function StatusPill({ state }: { state: OrbState }) {
  return (
    <div className="glass" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderRadius: 999, fontSize: 13,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[state],
        animation: state !== 'idle' ? 'orb-pulse-listen 1.5s infinite' : 'none',
      }} />
      {labels[state]}
    </div>
  )
}
