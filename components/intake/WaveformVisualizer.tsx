'use client'
import { useEffect, useRef } from 'react'

type Mode = 'sofia' | 'user' | 'idle'

interface Props {
  mode: Mode
  stream?: MediaStream | null
}

export function WaveformVisualizer({ mode, stream }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (mode === 'user' && stream) {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser
      contextRef.current = ctx
      sourceRef.current = source
    }
    return () => {
      sourceRef.current?.disconnect()
      contextRef.current?.close()
      analyserRef.current = null
    }
  }, [mode, stream])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const BAR_COUNT = 24
    const colors = {
      sofia: '#a855f7',
      user: '#06b6d4',
      idle: 'rgba(255,255,255,0.15)',
    }

    let frame = 0

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const color = colors[mode]
      const w = canvas.width
      const h = canvas.height
      const barW = (w / BAR_COUNT) * 0.6
      const gap = (w / BAR_COUNT) * 0.4

      let heights: number[] = []

      if (mode === 'user' && analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * data.length)
          heights.push((data[idx] / 255) * h * 0.85)
        }
      } else if (mode === 'sofia') {
        frame++
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = Math.sin(frame * 0.08 + i * 0.4) * 0.4 + 0.5
          const pulse = Math.sin(frame * 0.03) * 0.2 + 0.8
          heights.push(wave * pulse * h * 0.75)
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) heights.push(4)
      }

      heights.forEach((barH, i) => {
        const x = i * (barW + gap) + gap / 2
        const y = (h - barH) / 2
        ctx.fillStyle = color
        ctx.globalAlpha = mode === 'idle' ? 0.3 : 0.85
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 3)
        ctx.fill()
      })

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [mode])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      style={{ display: 'block' }}
    />
  )
}
