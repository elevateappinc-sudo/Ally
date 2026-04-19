'use client'
import { useEffect, useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WaveformVisualizer } from '@/components/intake/WaveformVisualizer'
import { ConversationTranscript, Turn } from '@/components/intake/ConversationTranscript'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { VoiceOrb } from '@/components/onboarding/VoiceOrb'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

type Status = 'mode-select' | 'initializing' | 'listening' | 'thinking' | 'speaking' | 'complete' | 'error'
type InputMode = 'voice' | 'text'

const BLOCKS = ['business_basics', 'inventory_basic', 'objectives', 'current_situation', 'customer', 'competition', 'resources']

interface Props { orgId: string }

function extractBusinessContextFromHistory(_turns: Turn[]): { name: string; industry: string; location: string } {
  // Best-effort extraction — inventory endpoints still work with empty strings; Claude infers from the document itself
  return { name: '', industry: '', location: '' }
}

export function IntakeClient({ orgId }: Props) {
  const router = useRouter()
  const { speak } = useSpeechSynthesis()

  const [status, setStatus] = useState<Status>('mode-select')
  const [inputMode, setInputMode] = useState<InputMode>('voice')
  const [micError, setMicError] = useState<string | null>(null)
  const [history, setHistory] = useState<Turn[]>([])
  const [liveTranscript, setLiveTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [blockIndex, setBlockIndex] = useState(0)
  const [resumed, setResumed] = useState(false)
  const [showInventoryInput, setShowInventoryInput] = useState(false)
  const [businessBrief, setBusinessBrief] = useState<any>(null)
  const [businessContext, setBusinessContext] = useState<{ name: string; industry: string; location: string } | null>(null)

  const recognitionRef = useRef<any>(null)
  const isPausedRef = useRef(false)
  const isListeningRef = useRef(false)
  const inputModeRef = useRef<InputMode>('voice')
  useEffect(() => { inputModeRef.current = inputMode }, [inputMode])
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentTextRef = useRef('')
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])

  // Timer
  useEffect(() => {
    if (status === 'mode-select' || status === 'complete') return
    const t = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = Math.min(100, Math.round((blockIndex / BLOCKS.length) * 100))

  // Initialize session
  const initSession = useCallback(async () => {
    setStatus('initializing')
    let res
    try {
      res = await fetch('/api/intake/session', { method: 'POST' })
    } catch (err) {
      console.error('[initSession] fetch failed:', err)
      setStatus('error'); return
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[initSession] session error:', res.status, body)
      setStatus('error'); return
    }
    const { sessionId: sid, resumed: r, conversationHistory } = await res.json()
    console.log('[initSession] ok — sid:', sid, 'resumed:', r)
    setSessionId(sid)
    if (r && conversationHistory?.length > 0) {
      setHistory(conversationHistory)
      setResumed(true)
    }
    return { sid, resumed: r, conversationHistory }
  }, [])

  // Send message to Claude — mode passed explicitly to avoid ref timing issues
  const sendMessage = useCallback(async (
    message: string,
    currentHistory: Turn[],
    sid: string,
    mode: InputMode,
  ) => {
    setStatus('thinking')
    setLiveTranscript('')

    const apiHistory = currentHistory.map(t => ({ role: t.role, content: t.content }))

    let res
    try {
      res = await fetch('/api/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message, conversationHistory: apiHistory }),
      })
    } catch {
      setStatus('error'); return
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('[sendMessage] API error:', res.status, errData)
      setStatus('error'); return
    }

    const { response: rawResponse, isComplete, businessBrief: brief } = await res.json()

    // Detect inventory input marker
    const inventoryMarker = '[SHOW_INVENTORY_INPUT]'
    let response = rawResponse
    if (rawResponse.includes(inventoryMarker)) {
      response = rawResponse.replace(inventoryMarker, '').trim()
      setShowInventoryInput(true)
      setBusinessContext(extractBusinessContextFromHistory(currentHistory))
      isPausedRef.current = true
    }

    // Capture business brief when intake is complete
    if (brief) setBusinessBrief(brief)

    const newHistory: Turn[] = [
      ...currentHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response },
    ]
    setHistory(newHistory)

    const turns = newHistory.filter(t => t.role === 'user').length
    setBlockIndex(Math.min(BLOCKS.length, Math.floor(turns / 3)))

    if (mode === 'voice') {
      setStatus('speaking')
      await speak(response)
    }

    if (isComplete) {
      setStatus('complete')
      return newHistory
    }

    setStatus('listening')
    isPausedRef.current = false
    return newHistory
  }, [speak])

  // Called after document or website processing — injects result into conversation
  const handleInventoryResult = useCallback(async (
    extraction: { categories: string[]; signature_items: string[]; special_attributes: string[]; observations: string },
    _inputMethod: 'document' | 'website'
  ) => {
    setShowInventoryInput(false)
    if (!sessionId) return

    const parts: string[] = []
    if (extraction.categories.length) parts.push(`Categorías: ${extraction.categories.join(', ')}`)
    if (extraction.signature_items.length) parts.push(`Producto estrella: ${extraction.signature_items.join(', ')}`)
    if (extraction.special_attributes.length) parts.push(`Opciones especiales: ${extraction.special_attributes.join(', ')}`)
    if (extraction.observations) parts.push(extraction.observations)

    const userMessage = `Acá está mi inventario básico. ${parts.join('. ')}`

    isPausedRef.current = false
    await sendMessage(userMessage, history, sessionId, inputModeRef.current)
  }, [sessionId, history, sendMessage])

  // Voice recognition setup
  const startVoiceRecognition = useCallback((sid: string, initialHistory: Turn[]) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setStatus('error'); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES'

    const latestHistoryRef = { current: initialHistory }

    recognition.onresult = (event: any) => {
      if (isPausedRef.current) return
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text = event.results[i][0].transcript
      }
      currentTextRef.current = text
      setLiveTranscript(text)

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (text.trim()) {
        silenceTimerRef.current = setTimeout(async () => {
          const t = currentTextRef.current.trim()
          if (!t || statusRef.current !== 'listening') return
          isPausedRef.current = true
          currentTextRef.current = ''
          setLiveTranscript('')
          const updated = await sendMessage(t, latestHistoryRef.current, sid, 'voice')
          if (updated) latestHistoryRef.current = updated
          isPausedRef.current = false
        }, 1800)
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current && !isPausedRef.current) {
        try { recognition.start() } catch {}
      }
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    recognition.start()
  }, [sendMessage])

  // Start voice mode
  const startVoice = useCallback(async () => {
    setInputMode('voice')

    // Request mic FIRST — must happen immediately on click before any awaits
    // so the browser recognizes the user gesture and shows the permission dialog
    let micStream: MediaStream
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(micStream)
      setMicError(null)
    } catch (err: any) {
      console.error('[startVoice] mic error:', err)
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setMicError('No se encontró un micrófono en este dispositivo. Conectá uno o usá el modo texto.')
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicError('El acceso al micrófono fue denegado. Habilitalo en la configuración del navegador e intentá de nuevo.')
      } else {
        setMicError('No se pudo acceder al micrófono. Verificá que esté conectado y que el navegador tenga permiso.')
      }
      return
    }

    console.log('[startVoice] mic ok, init session')
    const data = await initSession()
    if (!data) { console.log('[startVoice] initSession returned null'); return }

    console.log('[startVoice] step 3: speak opening')
    setStatus('speaking')
    const hasHistory = data.resumed && Array.isArray(data.conversationHistory) && data.conversationHistory.length > 0
    const openingLine = hasHistory
      ? 'Bienvenida de nuevo. ¿Continuamos donde quedamos?'
      : 'Hola, soy Sofía. Cuéntame: ¿qué hacés y qué necesitás de mí?'

    const opening: Turn = { role: 'assistant', content: openingLine }
    const initHistory = hasHistory ? data.conversationHistory : [opening]
    if (!hasHistory) setHistory([opening])

    try {
      await speak(openingLine)
      console.log('[startVoice] step 3: speak done')
    } catch (err) {
      console.error('[startVoice] speak error:', err)
    }

    console.log('[startVoice] step 4: startVoiceRecognition')
    setStatus('listening')
    startVoiceRecognition(data.sid, initHistory)
  }, [initSession, speak, startVoiceRecognition])

  // Start text mode
  const startText = useCallback(async () => {
    setInputMode('text')
    console.log('[startText] step 1: initSession')
    const data = await initSession()
    if (!data) { console.log('[startText] initSession returned null'); return }

    const hasHistory = data.resumed && Array.isArray(data.conversationHistory) && data.conversationHistory.length > 0
    const openingLine = hasHistory
      ? 'Bienvenida de nuevo. ¿Continuamos donde quedamos?'
      : 'Hola, soy Sofía. Cuéntame: ¿qué hacés y qué necesitás de mí?'

    const opening: Turn = { role: 'assistant', content: openingLine }
    if (!hasHistory) setHistory([opening])
    console.log('[startText] ready, history:', hasHistory)
    setStatus('listening')
  }, [initSession])

  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || !sessionId || status === 'thinking') return
    const msg = textInput.trim()
    setTextInput('')
    await sendMessage(msg, history, sessionId, 'text')
  }, [textInput, sessionId, status, history, sendMessage])

  const handleStop = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    stream?.getTracks().forEach(t => t.stop())
    router.push('/dashboard')
  }, [stream, router])

  // Complete → go to Agent 2 setup
  useEffect(() => {
    if (status !== 'complete') return
    isListeningRef.current = false
    recognitionRef.current?.stop()
    stream?.getTracks().forEach(t => t.stop())
    router.push('/setup')
  }, [status, stream, router])

  // Mode select screen
  if (status === 'mode-select') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32, gap: 48,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
            Conversación con <span className="gradient-text">Sofía</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 17 }}>
            Sofía te va a hacer unas preguntas para entender tu negocio y crear tu estrategia
          </p>
        </div>

        {micError && (
          <div style={{
            width: '100%', maxWidth: 640, background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <p style={{ color: '#f87171', fontSize: 14 }}>⚠️ {micError}</p>
            <button onClick={startVoice} className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: 13 }}>
              🎤 Permitir micrófono e intentar de nuevo
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 640 }}>
          <button onClick={startVoice} style={{
            flex: 1, minWidth: 260, background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
            border: '2px solid rgba(168,85,247,0.4)', borderRadius: 20, padding: 32,
            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <span style={{ fontSize: 36 }}>🎤</span>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>Conversación por voz</p>
              <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>~15 min · más natural y fluido</p>
            </div>
          </button>

          <button onClick={startText} style={{
            flex: 1, minWidth: 260, background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.03))',
            border: '2px solid rgba(6,182,212,0.3)', borderRadius: 20, padding: 32,
            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <span style={{ fontSize: 36 }}>⌨️</span>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>Chat escrito</p>
              <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>A tu ritmo · más control</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (status === 'initializing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-dim)' }}>Iniciando sesión...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <p style={{ color: 'var(--siri-pink)', fontSize: 18 }}>Ocurrió un error. ¿Intentamos de nuevo?</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setStatus('mode-select')} className="btn btn-primary">Reintentar</button>
          <button onClick={() => router.push('/dashboard')} className="btn btn-glass">Ir al dashboard</button>
        </div>
      </div>
    )
  }

  const waveMode = status === 'speaking' ? 'sofia' : status === 'listening' ? 'user' : 'idle'
  const isThinking = status === 'thinking'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 28,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          Conversando con <span className="gradient-text">Sofía</span>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{formatTime(elapsedSeconds)}</p>
      </div>

      {/* Voice mode: waveform + status label */}
      {inputMode === 'voice' && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '20px 28px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 12,
        }}>
          <WaveformVisualizer mode={waveMode} stream={stream} />
          <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>
            {status === 'listening' ? '🎤 Escuchando...' : status === 'thinking' ? '💭 Pensando...' : status === 'speaking' ? '🔊 Sofía hablando...' : ''}
          </p>
        </div>
      )}

      {/* Progress */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-dim)' }}>
          <span>Progreso de la entrevista</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
            borderRadius: 4, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Transcript */}
      <ConversationTranscript history={history} liveTranscript={liveTranscript} />

      {/* Inventory input panel — appears when Claude outputs [SHOW_INVENTORY_INPUT] */}
      {showInventoryInput && (
        <InventoryInputPanel
          sessionId={sessionId!}
          businessContext={businessContext}
          onResult={handleInventoryResult}
          onVoice={() => {
            setShowInventoryInput(false)
            isPausedRef.current = false
          }}
        />
      )}

      {/* Text mode: always-visible input, disabled while thinking */}
      {inputMode === 'text' && !showInventoryInput && (
        <>
          {isThinking && (
            <p style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic' }}>💭 Sofía está pensando...</p>
          )}
          <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560 }}>
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={isThinking ? 'Esperando respuesta...' : 'Escribí tu respuesta...'}
              disabled={isThinking}
              autoFocus
              style={{
                flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none',
                opacity: isThinking ? 0.5 : 1,
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={isThinking}>Enviar</button>
          </form>
        </>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleStop} className="btn btn-glass" style={{ fontSize: 13, padding: '8px 20px' }}>
          ⏹ Terminar
        </button>
      </div>
    </div>
  )
}

interface InventoryInputPanelProps {
  sessionId: string
  businessContext: { name: string; industry: string; location: string } | null
  onResult: (extraction: { categories: string[]; signature_items: string[]; special_attributes: string[]; observations: string }, method: 'document' | 'website') => void
  onVoice: () => void
}

function InventoryInputPanel({ sessionId, businessContext, onResult, onVoice }: InventoryInputPanelProps) {
  const [mode, setMode] = useState<'select' | 'upload' | 'website'>('select')
  const [processing, setProcessing] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`El archivo es muy grande. Máximo ${file.type === 'application/pdf' ? '10MB' : '5MB'}.`)
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      setError('Solo se aceptan PDF, JPG y PNG.')
      return
    }

    setError(null)
    setProcessing(true)

    try {
      const sb = createBrowserClient()
      const storagePath = `${sessionId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await sb.storage
        .from('intake-documents')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
      const res = await fetch('/api/agents/1/process-inventory-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          storage_path: storagePath,
          file_type: fileType,
          business_context: businessContext ?? { name: '', industry: '', location: '' },
        }),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { extraction } = await res.json()
      onResult(extraction, 'document')
    } catch {
      setError('No se pudo procesar el archivo. Continuá por voz.')
    } finally {
      setProcessing(false)
    }
  }

  const handleWebsite = async () => {
    if (!websiteUrl.trim()) return
    setError(null)
    setProcessing(true)
    try {
      const res = await fetch('/api/agents/1/process-inventory-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: websiteUrl.trim(),
          business_context: businessContext ?? { name: '', industry: '', location: '' },
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { extraction } = await res.json()
      onResult(extraction, 'website')
    } catch {
      setError('No se pudo analizar el sitio. Continuá por voz.')
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div style={{
        width: '100%', maxWidth: 560, background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Analizando {mode === 'website' ? 'sitio web' : 'documento'}... (10-30 segundos)
        </p>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', maxWidth: 560, background: 'rgba(168,85,247,0.08)',
      border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        ¿Cómo querés compartir tu inventario?
      </p>

      {mode === 'select' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'upload', icon: '📄', label: 'Subir archivo', sub: 'PDF o imagen' },
            { id: 'website', icon: '🔗', label: 'Link de sitio', sub: 'Menú o catálogo online' },
            { id: 'voice', icon: '🎤', label: 'Contarlo por voz', sub: 'Descripción verbal' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => opt.id === 'voice' ? onVoice() : setMode(opt.id as 'upload' | 'website')}
              style={{
                flex: '1 1 140px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px',
                cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{opt.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border: '2px dashed rgba(168,85,247,0.4)', borderRadius: 12, padding: 24,
            cursor: 'pointer', background: 'rgba(168,85,247,0.05)',
          }}>
            <span style={{ fontSize: 32 }}>📎</span>
            <span style={{ fontSize: 14, color: 'white' }}>Tocá para seleccionar archivo</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>PDF (máx 10MB) · JPG/PNG (máx 5MB)</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setMode('select')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>← Volver</button>
        </div>
      )}

      {mode === 'website' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://tu-negocio.com/menu"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 15, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMode('select')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>← Volver</button>
            <button onClick={handleWebsite} className="btn btn-primary" style={{ flex: 1 }} disabled={!websiteUrl.trim()}>
              Analizar sitio
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>⚠️ {error}</p>
          <button onClick={onVoice} className="btn btn-glass" style={{ fontSize: 12, padding: '6px 12px' }}>Continuar por voz</button>
        </div>
      )}
    </div>
  )
}
