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

  const clearTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    if (!currentText.current.trim()) return
    silenceTimer.current = setTimeout(() => {
      const t = currentText.current.trim()
      if (t) { onSilence(t); currentText.current = '' }
    }, silenceTimeout)
  }, [clearTimer, onSilence, silenceTimeout])

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
      onTranscript(text, isFinal)
      if (text) startTimer()
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
  }, [lang, onTranscript, startTimer])

  const stop = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setState('stopped')
  }, [])

  return { state, hasPermission, requestPermission, pause, resume, stop }
}
