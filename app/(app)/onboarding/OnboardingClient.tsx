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
import { createClient } from '@/lib/supabase/client'

export function OnboardingClient({ orgId, needsSetup = false }: { orgId: string; needsSetup?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [transcript, setTranscript] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const [setupDone, setSetupDone] = useState(!needsSetup)
  const [setupInput, setSetupInput] = useState('')
  const { speak } = useSpeechSynthesis()
  const { step, currentStep, answer, finish, saving, done, totalSteps } = useOnboarding(orgId)

  const hasGreetedRef = useRef(false)
  const stepSpokenRef = useRef(-1)
  const voiceRef = useRef<ReturnType<typeof useVoiceRecognition> | null>(null)
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  // After Sofia speaks a question, resume mic if already started, else show button
  const resumeAfterSpeak = useCallback(() => {
    if (modeRef.current === 'voice' && voiceRef.current) {
      if (voiceRef.current.hasPermission) {
        voiceRef.current.resume()
        setOrbState('listening')
      } else {
        setOrbState('idle') // shows "Activar micrófono" button
      }
    } else {
      setOrbState('idle')
    }
  }, [])

  const handleAnswer = useCallback(async (value: string) => {
    if (!value.trim()) return
    setTranscript('')
    voiceRef.current?.pause()
    setOrbState('thinking')

    if (step === totalSteps - 1) {
      await finish(value)
    } else {
      answer(value)
      // speaking next question handled by step useEffect
    }
  }, [step, totalSteps, answer, finish])

  const [debugLog, setDebugLog] = useState<string[]>([])
  const addLog = useCallback((msg: string) => {
    setDebugLog(prev => [...prev.slice(-6), `${new Date().toLocaleTimeString()}: ${msg}`])
  }, [])

  const voiceRecognition = useVoiceRecognition({
    onTranscript: (text) => {
      setTranscript(text)
      setOrbState('listening')
      addLog(`🎤 transcript: "${text}"`)
    },
    onSilence: async (text) => {
      if (modeRef.current !== 'voice') return
      addLog(`✅ silence → answer: "${text}" (step ${step})`)
      await handleAnswer(text)
    },
  })
  useEffect(() => { voiceRef.current = voiceRecognition })

  // Speak greeting once setup is done (step 0)
  useEffect(() => {
    if (!setupDone) return
    if (hasGreetedRef.current) return
    hasGreetedRef.current = true
    stepSpokenRef.current = 0
    setOrbState('speaking')
    speak(`Hola, soy Sofía, tu consultora de marketing personal. Voy a hacerte unas preguntas rápidas para crear tu estrategia personalizada. ${currentStep.question}`)
      .then(resumeAfterSpeak)
  }, [setupDone])

  // Speak next question when step advances (step 1+)
  useEffect(() => {
    if (!setupDone) return
    if (step === 0) return
    if (stepSpokenRef.current === step) return
    stepSpokenRef.current = step
    setOrbState('speaking')
    speak(currentStep.question).then(resumeAfterSpeak)
  }, [step, setupDone])

  // Redirect when done
  useEffect(() => {
    if (!done) return
    setOrbState('thinking')
    speak('Perfecto, ya tengo todo lo que necesito. Estoy armando tu estrategia personalizada, dame un momento...')
      .then(async () => {
        const res = await fetch('/api/generate-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId }),
        })
        if (res.ok) router.push('/dashboard')
      })
  }, [done])

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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupInput.trim()) return
    setOrbState('thinking')
    await supabase.from('organizations').update({ name: setupInput.trim() }).eq('id', orgId)
    setSetupDone(true)
    setOrbState('idle')
  }

  if (!setupDone) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, gap: 40,
      }}>
        <VoiceOrb state={orbState} />
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>¿Cómo se llama tu negocio?</h2>
          <p style={{ fontSize: 17, color: 'var(--text-dim)' }}>Podés cambiarlo después en Configuración</p>
        </div>
        <form onSubmit={handleSetupSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 500 }}>
          <input
            value={setupInput} onChange={e => setSetupInput(e.target.value)}
            placeholder="Ej: Ropa de mujer Laura, Pastelería Don José..."
            autoFocus
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary" disabled={orbState === 'thinking'}>
            Continuar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32, gap: 40,
    }}>
      <div style={{ position: 'fixed', top: 24, right: 24, display: 'flex', gap: 4 }}>
        {(['voice', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className="btn btn-glass"
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

      {saving && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Guardando...</p>}

      {/* Debug panel — remove before launch */}
      <div style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 500, margin: '0 auto',
        background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10, padding: 12, fontSize: 12, fontFamily: 'monospace',
        color: '#aaffaa', zIndex: 999,
      }}>
        <div style={{ color: '#ffff88', marginBottom: 6 }}>
          🐛 DEBUG — mic: {voiceRecognition.hasPermission ? '✅' : '❌'} | orb: {orbState} | step: {step}/{totalSteps} | mode: {mode}
        </div>
        {debugLog.map((l, i) => <div key={i}>{l}</div>)}
        {debugLog.length === 0 && <div style={{ color: '#666' }}>esperando eventos...</div>}
      </div>
    </div>
  )
}
