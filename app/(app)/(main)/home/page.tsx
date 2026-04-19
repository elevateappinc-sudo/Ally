'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, TrendingUp, Target, Wand2, CalendarDays, Star } from 'lucide-react'
import { useBrandStore } from '@/store/brandStore'
import { STRATEGIES } from '@/lib/strategies'

const TOP_STRATEGIES = STRATEGIES.filter(s => [1, 2, 4].includes(s.number))

const GRADIENT: Record<string, string> = {
  emerald: 'linear-gradient(135deg, #059669, #10b981)',
  violet: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  amber: 'linear-gradient(135deg, #d97706, #fbbf24)',
}

export default function HomePage() {
  const { activeBrand, fetchBrand } = useBrandStore()

  useEffect(() => {
    fetchBrand()
  }, [fetchBrand])

  return (
    <div className="max-w-[700px] mx-auto space-y-7 pt-8">

      {/* Welcome */}
      <div>
        <h1 className="text-[24px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
          {activeBrand ? (
            <>Trabajando en <span className="ig-grad-text">{activeBrand.name}</span></>
          ) : (
            'Bienvenido a Ally'
          )}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          {activeBrand
            ? `${activeBrand.industry ?? 'Marketing IA'} · Selecciona una estrategia para comenzar`
            : 'Tu agente de marketing completo'}
        </p>
      </div>

      {/* Hero CTA — Calendario */}
      <Link
        href="/calendar"
        className="relative overflow-hidden rounded-2xl p-6 shadow-card flex items-center justify-between group"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #c13584 50%, #e1306c 100%)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-widest">
              Calendario de contenido
            </span>
          </div>
          <p className="text-white font-bold text-[18px] leading-tight" style={{ letterSpacing: '-0.02em' }}>
            90 días de contenido listo
          </p>
          <p className="text-white/75 text-[13px] mt-1">
            Posts, reels y stories planificados por Ally
          </p>
        </div>
        <div className="relative flex items-center gap-1.5 bg-white text-[#c13584] text-[13px] font-bold px-4 py-2.5 rounded-xl hover:bg-rose-50 transition-colors shadow-sm shrink-0">
          Ver calendario
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Estrategias recomendadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-foreground" style={{ letterSpacing: '-0.015em' }}>
            Estrategias recomendadas
          </h2>
          <Link href="/strategies" className="text-[13px] font-semibold text-rose-600 hover:text-rose-700">
            Ver todas
          </Link>
        </div>

        <div className="space-y-2.5">
          {TOP_STRATEGIES.map(strategy => (
            <Link
              key={strategy.id}
              href={`/strategies/${strategy.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-border hover:border-rose-200 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[14px] shrink-0"
                style={{ background: GRADIENT[strategy.tagColor] ?? 'linear-gradient(135deg, #833ab4, #c13584)' }}
              >
                {strategy.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground truncate">{strategy.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{strategy.cost} · {strategy.speed}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: strategy.roi }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/research"
          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover hover:border-rose-200 transition-all"
        >
          <div className="w-9 h-9 rounded-xl ig-grad flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Tendencias</p>
            <p className="text-[11px] text-muted-foreground">Google + Reddit + IA</p>
          </div>
        </Link>
        <Link
          href="/strategies"
          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover hover:border-rose-200 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Estrategias</p>
            <p className="text-[11px] text-muted-foreground">10 estrategias de crecimiento</p>
          </div>
        </Link>
        <Link
          href="/campaigns"
          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover hover:border-rose-200 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Wand2 className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Campañas</p>
            <p className="text-[11px] text-muted-foreground">Campañas con IA</p>
          </div>
        </Link>
        <Link
          href="/branding"
          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover hover:border-rose-200 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-pink-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Branding</p>
            <p className="text-[11px] text-muted-foreground">Identidad visual IA</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
