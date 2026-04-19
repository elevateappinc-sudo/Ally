'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STRATEGIES, PHASE_LABELS } from '@/lib/strategies'
import { Star, ArrowRight, ChevronDown, ChevronUp, Zap, Bot } from 'lucide-react'

const TAG_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  pink: 'bg-pink-100 text-pink-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  orange: 'bg-orange-100 text-orange-700',
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
}

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

const phases = ['todos', 'mes1', 'mes2', 'mes3']
const phaseLabels: Record<string, string> = { todos: 'Todas', mes1: 'Mes 1', mes2: 'Mes 2', mes3: 'Mes 3+' }

export default function StrategiesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filter === 'todos' ? STRATEGIES : STRATEGIES.filter(s => s.phase === filter)

  const grouped = filtered.reduce<Record<string, typeof STRATEGIES>>((acc, s) => {
    acc[s.phase] = acc[s.phase] ?? []
    acc[s.phase].push(s)
    return acc
  }, {})

  return (
    <div className="pt-8 pb-16 max-w-4xl mx-auto">

      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
          Estrategias de marketing
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          10 estrategias ordenadas de mayor a menor ROI, listas para ejecutar con IA.
        </p>
      </div>

      {/* Modo autopilot vs copilot */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl p-5 space-y-2" style={{ background: 'linear-gradient(135deg, #833ab4, #c13584)' }}>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <span className="text-[13px] font-bold text-white">Modo Autopilot</span>
          </div>
          <p className="text-[12px] text-white/80 leading-relaxed">
            La IA ejecuta cada paso de la estrategia. Tú solo apruebas.
          </p>
        </div>
        <div className="rounded-2xl p-5 space-y-2 border-2 border-border bg-white">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-foreground" />
            <span className="text-[13px] font-bold text-foreground">Modo Copilot</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            La IA prepara todo el contenido. Tú decides cuándo y cómo ejecutas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {phases.map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
              filter === p
                ? 'ig-grad text-white shadow-sm'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-rose-200'
            }`}
          >
            {phaseLabels[p]}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {(filter === 'todos' ? ['mes1', 'mes2', 'mes3'] : [filter]).map(phase => {
          const strategies = grouped[phase]
          if (!strategies?.length) return null
          return (
            <div key={phase}>
              <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {PHASE_LABELS[phase]}
              </h2>
              <div className="space-y-3">
                {strategies.map(strategy => {
                  const isExpanded = expanded === strategy.id
                  return (
                    <div key={strategy.id} className="rounded-2xl border-2 border-border bg-white overflow-hidden hover:border-rose-200 transition-all">
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[15px] shadow-sm"
                            style={{ background: GRADIENT[strategy.tagColor] }}
                          >
                            {strategy.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mr-2 ${TAG_COLORS[strategy.tagColor]}`}>
                                  {strategy.tag}
                                </span>
                                <h3 className="text-[16px] font-bold text-foreground mt-1.5" style={{ letterSpacing: '-0.02em' }}>
                                  {strategy.title}
                                </h3>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < strategy.roi ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{strategy.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">💰 {strategy.cost}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">⚡ {strategy.speed}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">📈 {strategy.scalability}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">🎯 {strategy.difficulty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : strategy.id)}
                            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Menos detalles' : 'Ver pasos y detalles'}
                          </button>
                          <button
                            onClick={() => router.push(`/strategies/${strategy.id}`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl ig-grad text-white text-[12px] font-semibold shadow-button hover:opacity-90 transition-opacity"
                          >
                            Ejecutar estrategia
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-gray-50/60 px-5 py-4 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-2">¿Por qué funciona?</p>
                              <p className="text-[13px] text-muted-foreground leading-relaxed">{strategy.whyBest}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-2">Qué hace Ally</p>
                              <p className="text-[13px] text-muted-foreground leading-relaxed">{strategy.whatPauDoes}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-2">Pasos ({strategy.steps.length})</p>
                            <div className="grid md:grid-cols-2 gap-2">
                              {strategy.steps.map((step, i) => (
                                <div key={step.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-border">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white mt-0.5"
                                    style={{ background: GRADIENT[strategy.tagColor] }}>
                                    {i + 1}
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-semibold text-foreground">{step.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.estimatedTime}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-2">Canales</p>
                            <div className="flex flex-wrap gap-2">
                              {strategy.channels.map(ch => (
                                <span key={ch} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-white font-medium text-foreground">
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
