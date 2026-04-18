import { useCallback, useRef, useState } from 'react'

type VoiceState = 'idle' | 'listening' | 'stopped'

interface Options {
  onTranscript: (text: string, isFinal: boolean) => void
  onSilence: (text: string) => void
  silenceTimeout?: number
  lang?: string
}

export function useVoiceRecognition({
  onTranscript, onSilence, silenceTimeout = 1500, lang = 'es-ES',
}: Options) {
  const [state, setState] = useState<VoiceState>('idle')
  const [hasPermission, setHasPermission] = useState(false)
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)
  const isPausedRef = useRef(false)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentText = useRef('')

  // Always-fresh refs — updated every render so event handlers never go stale
  const onSilenceRef = useRef(onSilence)
  onSilenceRef.current = onSilence
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript
  const silenceTimeoutRef = useRef(silenceTimeout)
  silenceTimeoutRef.current = silenceTimeout

  const clearTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  // Ref-based startTimer so recognition.onresult always calls the latest version
  const startTimerRef = useRef(() => {})
  startTimerRef.current = () => {
    clearTimer()
    if (!currentText.current.trim()) return
    silenceTimer.current = setTimeout(() => {
      const t = currentText.current.trim()
      if (t) { onSilenceRef.current(t); currentText.current = '' }
    }, silenceTimeoutRef.current)
  }

  const pause = useCallback(() => { isPausedRef.current = true; clearTimer() }, [clearTimer])
  const resume = useCallback(() => { isPausedRef.current = false }, [])

  const requestPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasPermission(true)
    } catch {
      setState('stopped'); return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setState('stopped'); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event: any) => {
      if (isPausedRef.current) return
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text = event.results[i][0].transcript
      }
      const isFinal = event.results[event.results.length - 1]?.isFinal ?? false
      currentText.current = text
      onTranscriptRef.current(text, isFinal)
      if (text) startTimerRef.current()
    }

    recognition.onend = () => {
      if (isListeningRef.current && !isPausedRef.current) {
        try { recognition.start() } catch {}
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') { setState('stopped'); return }
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    recognition.start()
    setState('listening')
  }, [lang, clearTimer])

  const stop = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setState('stopped')
  }, [])

  return { state, hasPermission, requestPermission, pause, resume, stop }
}
