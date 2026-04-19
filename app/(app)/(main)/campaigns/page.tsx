'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBrandStore } from '@/store/brandStore'
import { Megaphone, Plus, ArrowRight, Sparkles } from 'lucide-react'

export default function CampaignsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeBrand, fetchBrand } = useBrandStore()

  const keyword = searchParams.get('keyword') ?? ''
  const insight = searchParams.get('insight') ?? ''
  const ideas = searchParams.get('ideas') ?? ''

  useEffect(() => {
    fetchBrand()
  }, [fetchBrand])

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-16 space-y-8">
      <div>
        <h1 className="text-[26px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>Campañas</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Crea campañas de contenido impulsadas por IA para tu negocio.</p>
      </div>

      {keyword && (
        <div className="rounded-2xl p-5 border border-rose-200 bg-rose-50">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-rose-700 mb-1">Insights de tendencias listos</p>
              <p className="text-[13px] text-rose-600">Nicho: <strong>{keyword}</strong></p>
              {insight && <p className="text-[12px] text-rose-500 mt-1 leading-relaxed">{insight}</p>}
              {ideas && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ideas.split('||').filter(Boolean).map((idea, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">{idea}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nueva campaña CTA */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-white p-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl ig-grad flex items-center justify-center mx-auto shadow-button">
          <Megaphone className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>Campañas próximamente</h2>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            La generación automática de campañas multicanal está en desarrollo. Por ahora, usa las Estrategias de Ally para generar contenido personalizado.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => router.push('/strategies')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl ig-grad text-white text-[13px] font-semibold shadow-button hover:opacity-90 transition-opacity"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Ver estrategias disponibles
          </button>
          <button
            onClick={() => router.push('/research')}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Investigar tendencias primero
          </button>
        </div>
      </div>
    </div>
  )
}
