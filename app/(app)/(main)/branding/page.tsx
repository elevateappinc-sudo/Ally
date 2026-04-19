'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBrandStore } from '@/store/brandStore'
import { Palette, Sparkles, ArrowRight, Wand2 } from 'lucide-react'

export default function BrandingPage() {
  const router = useRouter()
  const { activeBrand, fetchBrand } = useBrandStore()

  useEffect(() => {
    fetchBrand()
  }, [fetchBrand])

  return (
    <div className="pt-8 pb-12 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>Branding</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Identidad visual generada con IA — logo, colores y tipografía
          </p>
        </div>
      </div>

      {/* Brand info card */}
      {activeBrand && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl ig-grad flex items-center justify-center shrink-0 shadow-button">
              <span className="text-white font-black text-[18px]">{activeBrand.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>{activeBrand.name}</h2>
              {activeBrand.industry && <p className="text-[13px] text-muted-foreground mt-0.5">{activeBrand.industry}</p>}
              {activeBrand.description && <p className="text-[13px] text-foreground mt-3 leading-relaxed">{activeBrand.description}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Branding features */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Palette, title: 'Paleta de colores', desc: 'Colores primarios, secundarios y de acento coherentes con tu marca', tag: 'Próximamente' },
          { icon: Sparkles, title: 'Logo IA', desc: 'Logo profesional generado con inteligencia artificial', tag: 'Próximamente' },
          { icon: Wand2, title: 'Brandbook', desc: 'Guía completa de identidad visual lista para compartir', tag: 'Próximamente' },
          { icon: ArrowRight, title: 'Tipografía', desc: 'Combinaciones de fuentes profesionales para tu marca', tag: 'Próximamente' },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-foreground">{item.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{item.tag}</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <Palette className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">Branding IA en desarrollo</h3>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-sm mx-auto">
            Mientras tanto, la estrategia de marca ya fue definida por Ally en la fase de setup.
          </p>
        </div>
        <button
          onClick={() => router.push('/strategies')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ig-grad text-white text-[13px] font-semibold shadow-button hover:opacity-90 transition-opacity"
        >
          Ejecutar estrategia de marketing
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
