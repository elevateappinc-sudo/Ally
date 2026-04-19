'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBrandStore } from '@/store/brandStore'
import { getStrategy } from '@/lib/strategies'
import {
  ChevronLeft, Bot, Zap, ArrowRight, CheckCircle2,
  Copy, Download, RefreshCw, Play, Clock,
} from 'lucide-react'

const GRADIENT: Record<string, string> = {
  emerald: 'linear-gradient(135deg, #059669, #10b981)',
  violet: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  blue: 'linear-gradient(135deg, #2563eb, #60a5fa)',
  amber: 'linear-gradient(135deg, #d97706, #fbbf24)',
  pink: 'linear-gradient(135deg, #db2777, #f472b6)',
  cyan: 'linear-gradient(135deg, #0891b2, #22d3ee)',
  orange: 'linear-gradient(135deg, #ea580c, #fb923c)',
  slate: 'linear-gradient(135deg, #475569, #94a3b8)',
  green: 'linear-gradient(135deg, #16a34a, #4ade80)',
  red: 'linear-gradient(135deg, #dc2626, #f87171)',
}

type Mode = 'autopilot' | 'copilot' | null
type ExecState = 'idle' | 'running' | 'done'

interface StepResult {
  stepId: string
  content: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export default function StrategyExecutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { activeBrand, fetchBrand } = useBrandStore()
  const strategy = getStrategy(id)

  const [mode, setMode] = useState<Mode>(null)
  const [execState, setExecState] = useState<ExecState>('idle')
  const [results, setResults] = useState<StepResult[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBrand()
  }, [fetchBrand])

  if (!strategy) return (
    <div className="pt-8 text-center">
      <p className="text-muted-foreground">Estrategia no encontrada</p>
      <button onClick={() => router.back()} className="mt-4 text-rose-500 text-sm underline">Volver</button>
    </div>
  )

  const grad = GRADIENT[strategy.tagColor]

  const handleExecute = async () => {
    if (!activeBrand || !mode) return
    setExecState('running')
    setError('')
    setResults(strategy.steps.map(s => ({ stepId: s.id, content: '', status: 'pending' })))

    try {
      const res = await fetch('/api/strategies/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: strategy.id,
          mode,
          brand: {
            name: activeBrand.name,
            industry: activeBrand.industry,
            description: activeBrand.description,
            color: activeBrand.color,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error ejecutando estrategia')

      for (let i = 0; i < strategy.steps.length; i++) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r))
        await new Promise(r => setTimeout(r, 600))
        const stepData = data.steps?.[strategy.steps[i].id] ?? ''
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, content: stepData, status: 'done' } : r))
      }
      setExecState('done')
    } catch (e) {
      setError(String(e))
      setExecState('idle')
    }
  }

  const copyContent = (content: string, key: string) => {
    navigator.clipboard.writeText(content)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="pt-6 pb-16 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[15px] shadow-sm" style={{ background: grad }}>
            {strategy.number}
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground" style={{ letterSpacing: '-0.025em' }}>{strategy.title}</h1>
            <p className="text-[12px] text-muted-foreground">{activeBrand?.name ?? 'Cargando...'} · {strategy.steps.length} pasos</p>
          </div>
        </div>
      </div>

      {/* STEP 1: Select mode */}
      {execState === 'idle' && !mode && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-1">¿Qué hará Ally?</p>
            <p className="text-[15px] text-foreground leading-relaxed">{strategy.whatPauDoes}</p>
          </div>
          <h2 className="text-[16px] font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>Elige cómo quieres trabajar</h2>
          <div className="grid gap-4">
            <button onClick={() => setMode('autopilot')} className="text-left rounded-2xl p-6 text-white relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, #833ab4 0%, #c13584 50%, #e1306c 100%)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%,-30%)' }} />
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[17px] font-bold mb-1">Autopilot — IA ejecuta todo</p>
                  <p className="text-[13px] text-white/80 leading-relaxed">{strategy.autopilotDesc}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-[12px] font-semibold">
                    Elegir Autopilot <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </button>
            <button onClick={() => setMode('copilot')} className="text-left rounded-2xl p-6 border-2 border-border hover:border-rose-200 bg-white group transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-rose-50 flex items-center justify-center shrink-0 transition-colors">
                  <Zap className="w-5 h-5 text-gray-500 group-hover:text-rose-500 transition-colors" />
                </div>
                <div>
                  <p className="text-[17px] font-bold text-foreground mb-1">Copilot — Tú decides</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{strategy.copilotDesc}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-rose-500">
                    Elegir Copilot <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Pasos ({strategy.steps.length})</p>
            <div className="space-y-2">
              {strategy.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: grad }}>{i + 1}</div>
                  <p className="flex-1 text-[13px] font-medium text-foreground">{step.title}</p>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{step.estimatedTime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Confirm */}
      {execState === 'idle' && mode && (
        <div className="space-y-5">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${mode === 'autopilot' ? 'text-white' : 'border border-border bg-white'}`}
            style={mode === 'autopilot' ? { background: 'linear-gradient(135deg, #833ab4, #c13584)' } : {}}
          >
            {mode === 'autopilot' ? <Bot className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5" />}
            <div>
              <p className={`text-[14px] font-bold ${mode === 'autopilot' ? 'text-white' : 'text-foreground'}`}>
                {mode === 'autopilot' ? 'Modo Autopilot seleccionado' : 'Modo Copilot seleccionado'}
              </p>
              <p className={`text-[12px] ${mode === 'autopilot' ? 'text-white/75' : 'text-muted-foreground'}`}>
                Para <strong>{activeBrand?.name}</strong> · {strategy.steps.length} pasos
              </p>
            </div>
            <button onClick={() => setMode(null)} className={`ml-auto text-[11px] underline ${mode === 'autopilot' ? 'text-white/70' : 'text-muted-foreground'}`}>
              Cambiar
            </button>
          </div>
          <div className="space-y-2">
            {strategy.steps.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-white">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5" style={{ background: grad }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{step.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{step.estimatedTime}</span>
              </div>
            ))}
          </div>
          {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[13px]">{error}</div>}
          <button onClick={handleExecute} disabled={!activeBrand} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl ig-grad text-white font-bold text-[15px] shadow-button hover:opacity-90 transition-opacity disabled:opacity-40">
            <Play className="w-5 h-5" />
            {mode === 'autopilot' ? 'Iniciar Autopilot' : 'Generar contenido con Copilot'}
          </button>
        </div>
      )}

      {/* STEP 3: Running */}
      {execState === 'running' && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl ig-grad flex items-center justify-center mx-auto mb-4 animate-pulse shadow-button">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <p className="text-[16px] font-bold text-foreground">Ally está ejecutando la estrategia...</p>
            <p className="text-[13px] text-muted-foreground mt-1">Generando contenido para {activeBrand?.name}</p>
          </div>
          <div className="space-y-2">
            {strategy.steps.map((step, i) => {
              const result = results[i]
              return (
                <div key={step.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  result?.status === 'done' ? 'border-emerald-200 bg-emerald-50' :
                  result?.status === 'running' ? 'border-rose-200 bg-rose-50' : 'border-border bg-white'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    result?.status === 'done' ? 'bg-emerald-500' :
                    result?.status === 'running' ? '' : 'bg-gray-200'
                  }`} style={result?.status === 'running' ? { background: grad } : {}}>
                    {result?.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                     result?.status === 'running' ? <RefreshCw className="w-4 h-4 text-white animate-spin" /> :
                     <span className="text-[11px] font-bold text-gray-500">{i + 1}</span>}
                  </div>
                  <p className={`text-[13px] font-medium ${
                    result?.status === 'done' ? 'text-emerald-700' :
                    result?.status === 'running' ? 'text-rose-700' : 'text-muted-foreground'
                  }`}>{step.title}</p>
                  {result?.status === 'running' && <span className="ml-auto text-[11px] text-rose-500 animate-pulse">Generando...</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Results */}
      {execState === 'done' && (
        <div className="space-y-5">
          <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-bold text-[16px]">¡Estrategia generada!</p>
                <p className="text-[12px] text-white/80 mt-0.5">{strategy.title} · {activeBrand?.name} · Modo {mode === 'autopilot' ? 'Autopilot' : 'Copilot'}</p>
              </div>
            </div>
          </div>

          {strategy.steps.map((step, i) => {
            const result = results[i]
            if (!result?.content) return null
            return (
              <div key={step.id} className="rounded-2xl border border-border bg-white overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border bg-gray-50/50">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: grad }}>{i + 1}</div>
                  <p className="text-[14px] font-bold text-foreground flex-1">{step.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => copyContent(result.content, step.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                      {copied === step.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === step.id ? '¡Copiado!' : 'Copiar'}
                    </button>
                    <button onClick={() => {
                      const blob = new Blob([result.content], { type: 'text/plain' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = `${strategy.id}-${step.id}.txt`
                      a.click()
                    }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <Download className="w-3.5 h-3.5" />TXT
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{result.content}</pre>
                </div>
              </div>
            )
          })}

          <div className="flex gap-3">
            <button onClick={() => { setExecState('idle'); setResults([]); setMode(null) }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-border hover:border-rose-200 text-[13px] font-semibold text-foreground transition-all">
              <RefreshCw className="w-4 h-4" />Regenerar
            </button>
            <button onClick={() => router.push('/strategies')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ig-grad text-white text-[13px] font-semibold shadow-button hover:opacity-90 transition-opacity">
              Ver otras estrategias<ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
