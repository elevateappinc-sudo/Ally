'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, TrendingUp, Sparkles, Loader2, ArrowRight,
  Hash, Lightbulb, MessageCircle, ExternalLink, BarChart2,
} from 'lucide-react'
import type { TrendResult } from '@/types/pau'

const suggestedNiches = [
  'ropa deportiva', 'café de especialidad', 'skincare natural',
  'fitness en casa', 'comida vegana', 'tecnología Apple',
  'viajes low cost', 'fotografía móvil', 'cursos online',
]

function InterestChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const recent = data.slice(-12)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-16">
        {recent.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm transition-all" style={{
              height: `${Math.max((d.value / max) * 56, 2)}px`,
              background: d.value > 70 ? 'linear-gradient(180deg, #dc2743, #cc2366)' : d.value > 40 ? 'linear-gradient(180deg, #f09433, #e6683c)' : '#e5e7eb',
            }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{recent[0]?.date}</span><span>Hoy</span>
      </div>
    </div>
  )
}

export default function ResearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrendResult | null>(null)
  const [error, setError] = useState('')
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([])

  const handleSearch = async (kw?: string) => {
    const keyword = kw ?? query
    if (!keyword.trim()) return
    setQuery(keyword)
    setLoading(true)
    setError('')
    setResult(null)
    setSelectedIdeas([])
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
    } catch {
      setError('No se pudieron obtener las tendencias. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const toggleIdea = (idea: string) =>
    setSelectedIdeas(prev => prev.includes(idea) ? prev.filter(i => i !== idea) : [...prev, idea])

  const handleCreateCampaign = () => {
    const params = new URLSearchParams({
      keyword: result?.keyword ?? '',
      insight: result?.insight ?? '',
      ideas: selectedIdeas.join('||'),
      hashtags: result?.hashtags?.join(',') ?? '',
    })
    router.push(`/campaigns?${params.toString()}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-10">
      <div>
        <h1 className="text-[22px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>Investigación de tendencias</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Descubre qué busca tu audiencia y crea campañas que conecten de verdad.</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ej: ropa deportiva, skincare, café de especialidad…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 ig-grad text-white text-[13px] font-bold px-5 py-3 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-button"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {loading ? 'Analizando…' : 'Analizar'}
        </button>
      </div>

      {!result && !loading && (
        <div className="space-y-3">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest">Nichos populares</p>
          <div className="flex flex-wrap gap-2">
            {suggestedNiches.map(n => (
              <button key={n} onClick={() => handleSearch(n)} className="px-3.5 py-1.5 rounded-xl text-[12px] font-medium border border-border bg-white text-foreground hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                {n}
              </button>
            ))}
          </div>
          <div className="mt-4 bg-white border border-dashed border-rose-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl ig-grad flex items-center justify-center opacity-60">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-[14px] font-bold text-foreground">Ingresa un nicho para comenzar</p>
            <p className="text-[12px] text-muted-foreground max-w-xs">Analizamos Google Trends, Reddit y usamos IA para darte insights accionables sobre tu mercado.</p>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-600">{error}</div>}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6 h-32 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Insight IA */}
          <div className="relative overflow-hidden rounded-2xl p-5 shadow-card" style={{ background: 'linear-gradient(135deg, #833ab4 0%, #c13584 40%, #e1306c 70%, #f77737 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%,-30%)' }} />
            <div className="relative flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest mb-1">Insight IA — {result.keyword}</p>
                <p className="text-[14px] text-white font-medium leading-relaxed">{result.insight}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.interest.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-5 space-y-3 shadow-card">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-500" />
                  <p className="text-[13px] font-bold text-foreground">Interés últimos 90 días</p>
                </div>
                <InterestChart data={result.interest} />
              </div>
            )}
            {result.relatedQueries.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-5 space-y-3 shadow-card">
                <p className="text-[13px] font-bold text-foreground">Búsquedas relacionadas</p>
                <ul className="space-y-2">
                  {result.relatedQueries.map((q, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[12px] text-foreground">{q.query}</span>
                          <span className="text-[11px] text-muted-foreground">{q.value}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${q.value}%`, background: 'linear-gradient(90deg, #f09433, #dc2743)' }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.risingQueries.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <p className="text-[13px] font-bold text-foreground mb-3">🔥 En tendencia al alza</p>
              <div className="flex flex-wrap gap-2">
                {result.risingQueries.map((q, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />{q.query}<span className="text-rose-400">{q.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.hashtags.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-rose-500" />
                <p className="text-[13px] font-bold text-foreground">Hashtags recomendados</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((h, i) => (
                  <span key={i} className="text-[12px] font-medium text-rose-500 bg-rose-50 px-3 py-1 rounded-full">#{h}</span>
                ))}
              </div>
            </div>
          )}

          {result.redditPosts.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                <p className="text-[13px] font-bold text-foreground">Lo que habla la gente</p>
              </div>
              <ul className="space-y-2.5">
                {result.redditPosts.map((post, i) => (
                  <li key={i}>
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 group hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors">
                      <span className="text-[10px] font-bold text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full mt-0.5 shrink-0">r/{post.subreddit}</span>
                      <p className="flex-1 text-[12px] text-foreground leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">{post.title}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.contentIdeas.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-rose-500" />
                <p className="text-[13px] font-bold text-foreground">Ideas de contenido</p>
                <span className="ml-auto text-[11px] text-muted-foreground">Selecciona las que quieras usar</span>
              </div>
              <ul className="space-y-2">
                {result.contentIdeas.map((idea, i) => {
                  const selected = selectedIdeas.includes(idea)
                  return (
                    <li key={i}>
                      <button onClick={() => toggleIdea(idea)} className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-rose-300 bg-rose-50' : 'border-border hover:border-rose-200 hover:bg-gray-50'}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selected ? 'border-rose-500 bg-rose-500' : 'border-gray-300'}`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <p className={`text-[13px] leading-snug ${selected ? 'text-rose-700 font-medium' : 'text-foreground'}`}>{idea}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-6">
            <button onClick={() => handleSearch()} className="flex items-center gap-2 text-[13px] font-semibold text-rose-600 border border-rose-200 bg-white px-4 py-3 rounded-xl hover:bg-rose-50 transition-all">
              <Search className="w-4 h-4" />Nueva búsqueda
            </button>
            <button onClick={handleCreateCampaign} className="flex-1 flex items-center justify-center gap-2 ig-grad text-white text-[13px] font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-button">
              <Sparkles className="w-4 h-4" />Crear campaña con estos insights<ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
