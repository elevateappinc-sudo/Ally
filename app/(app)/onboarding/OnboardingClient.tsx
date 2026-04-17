'use client'
import { useEffect, useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceOrb, OrbState } from '@/components/onboarding/VoiceOrb'
import { StatusPill } from '@/components/onboarding/StatusPill'
import { TranscriptCard } from '@/components/onboarding/TranscriptCard'
import { QuickOptions } from '@/components/onboarding/QuickOptions'
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useOnboarding } from '@/hooks/useOnboarding'

export function OnboardingClient({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [transcript, setTranscript] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const { speak, stop: stopSpeech } = useSpeechSynthesis()
  const { step, currentStep, answer, finish, saving, done, totalSteps } = useOnboarding(orgId)
  const hasSpokenRef = useRef(false)
  // Use ref to avoid stale closure in onSilence callback
  const voiceRef = useRef<ReturnType<typeof useVoiceRecognition> | null>(null)
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step }, [step])

  const handleAnswer = useCallback(async (value: string) => {
    setTranscript('')
    voiceRef.current?.pause()

    if (step === totalSteps - 1) {
      setOrbState('thinking')
      if (step === 2) {
        await speak('Analizando tu perfil...')
        await new Promise(r => setTimeout(r, 2500))
      }
      await finish(value)
    } else {
      answer(value)
    }
  }, [step, totalSteps, answer, finish, speak])

  const voiceRecognition = useVoiceRecognition({
    onTranscript: (text) => { setTranscript(text); setOrbState('listening') },
    onSilence: async (text) => {
      if (mode !== 'voice') return
      await handleAnswer(text)
      if (stepRef.current < totalSteps - 1) {
        setOrbState('speaking')
        voiceRef.current?.pause()
        // Next step question is now current after answer() updated state
      }
    },
  })
  // Assign to ref so handleAnswer can access without stale closure
  useEffect(() => { voiceRef.current = voiceRecognition })

  // Speak greeting on mount
  useEffect(() => {
    if (hasSpokenRef.current) return
    hasSpokenRef.current = true
    setOrbState('speaking')
    speak('Hola, soy Sofía, tu consultora de marketing personal. Voy a hacerte unas preguntas rápidas para crear tu estrategia personalizada. ¿Qué vendes?')
      .then(() => setOrbState('idle'))
  }, [])

  // Redirect when done
  useEffect(() => {
    if (!done) return
    setOrbState('thinking')
    speak('Perfecto, ya tengo todo lo que necesito. Estoy armando tu estrategia personalizada, dame un momento...')
      .then(async () => {
        // Trigger strategy generation
        const res = await fetch('/api/generate-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId }),
        })
        if (res.ok) router.push('/dashboard')
      })
  }, [done, orgId, router, speak])

  const handleActivateMic = async () => {
    await voiceRecognition.requestPermission()
    setOrbState('listening')
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    await handleAnswer(textInput.trim())
    setTextInput('')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32, gap: 40,
    }}>
      {/* Mode toggle */}
      <div style={{ position: 'fixed', top: 24, right: 24, display: 'flex', gap: 4 }}>
        {(['voice', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`btn btn-glass`}
            style={{ padding: '8px 16px', fontSize: 13,
              borderColor: mode === m ? 'var(--siri-cyan)' : 'var(--border)' }}>
            {m === 'voice' ? 'Voz' : 'Texto'}
          </button>
        ))}
      </div>

      <ProgressIndicator current={step} total={totalSteps} />

      <VoiceOrb state={orbState} />

      <div style={{ textAlign: 'center', maxWidth: 500 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{currentStep.question}</h2>
        <p style={{ fontSize: 17, color: 'var(--text-dim)' }}>{currentStep.sub}</p>
      </div>

      <StatusPill state={orbState} />

      {transcript && <TranscriptCard text={transcript} />}

      {orbState === 'idle' && mode === 'voice' && (
        <button onClick={handleActivateMic} className="btn btn-primary">
          Activar micrófono
        </button>
      )}

      {currentStep.options.length > 0 && (
        <QuickOptions options={currentStep.options} onSelect={handleAnswer} />
      )}

      {mode === 'text' && (
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 500 }}>
          <input
            value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="Escribí tu respuesta..."
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary">Enviar</button>
        </form>
      )}

      {saving && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Guardando...</p>
      )}
    </div>
  )
}
