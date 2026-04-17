'use client'

export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking'

interface Props {
  state: OrbState
  size?: number
}

export function VoiceOrb({ state, size = 140 }: Props) {
  const stateClass = state !== 'idle' ? `orb-${state}` : ''

  return (
    <div style={{ position: 'relative', width: size, height: size }} className={stateClass}>
      <div className="orb-glow" style={{ background: getGlowColor(state) }} />
      <div
        className="orb"
        style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {state === 'speaking' && (
          <div className="waveform">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="wave-bar" />)}
          </div>
        )}
      </div>
    </div>
  )
}

function getGlowColor(state: OrbState) {
  if (state === 'listening') return 'var(--siri-blue)'
  if (state === 'speaking') return 'var(--siri-purple)'
  if (state === 'thinking') return 'var(--siri-pink)'
  return 'transparent'
}
