import { useCallback, useRef } from 'react'

export function useSpeechSynthesis() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopCurrent = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
  }, [])

  const speakTTS = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const spanishVoice = voices.find(v => v.lang.startsWith('es'))
      if (spanishVoice) utterance.voice = spanishVoice
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const speak = useCallback(async (text: string): Promise<void> => {
    stopCurrent()
    try {
      const res = await fetch('/api/voice/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      return new Promise(resolve => {
        audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); speakTTS(text).then(resolve) }
        audio.play().catch(() => speakTTS(text).then(resolve))
      })
    } catch {
      return speakTTS(text)
    }
  }, [stopCurrent, speakTTS])

  return { speak, stop: stopCurrent }
}
