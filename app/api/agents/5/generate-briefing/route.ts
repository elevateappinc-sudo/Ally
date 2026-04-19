import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export const maxDuration = 60

function parseJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

const BRIEFING_PROMPT = (post: any, strategy: any, brief: any) => {
  const voice = strategy.brand_voice ?? {}
  const hashtags = strategy.hashtags ?? {}
  const keywords = (strategy.keywords?.primary ?? []).map((k: any) => k.keyword)

  const isVideo = /reel|video/i.test(post.format ?? '')
  const isCarousel = /carrusel|carousel/i.test(post.format ?? '')

  const videoSchema = isVideo ? `,
    "video_scenes": [
      { "timestamp": "0-3 seg", "action": "descripción de la escena" }
    ],
    "transitions": "tipo de cortes",
    "pacing": "ritmo del video"` : ''

  const carouselSchema = isCarousel ? `,
    "slides": [
      { "number": 1, "title": "Título del slide", "text": "Texto corto (máx 2 líneas)", "visual": "Qué mostrar en este slide" }
    ]` : ''

  const musicSection = isVideo ? `
  "music": {
    "genre": "género musical",
    "mood": "mood de la música",
    "where_to_find": "dónde buscarla (ej: IG Reels trending audio)"
  },` : ''

  return `Sos un director creativo experto en redes sociales. Generá un briefing creativo COMPLETO y ACCIONABLE para este post.

POST:
- Plataforma: ${post.platform}
- Formato: ${post.format}
- Fecha: ${post.date} (${post.day})
- Pilar: ${post.pillar}
- Caption del calendario: ${post.caption}
- Brief visual base: ${post.visual_brief}
- CTA: ${post.cta}
- Mejor hora: ${post.best_time}
- Hashtags base: ${(post.hashtags ?? []).join(', ')}

VOZ DE MARCA:
- Arquetipo: ${voice.archetype ?? ''}
- Tono: ${(voice.tone_attributes ?? []).join(', ')}
- Uso de emojis: ${voice.emoji_usage ?? 'moderate'}
- Hablar así: ${(voice.do_say ?? []).slice(0, 3).join(' | ')}
- Evitar: ${(voice.dont_say ?? []).slice(0, 3).join(' | ')}

NEGOCIO:
- Nombre: ${brief.business_info?.name ?? ''}
- Industria: ${brief.business_info?.industry ?? ''}
- Ubicación: ${brief.business_info?.location ?? ''}
- Productos/servicios: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}

KEYWORDS: ${keywords.join(', ')}
HASHTAGS DISPONIBLES:
- De marca: ${(hashtags.branded ?? []).join(', ')}
- Nicho grande: ${(hashtags.large_niche ?? []).map((h: any) => h.tag).join(', ')}
- Nicho medio: ${(hashtags.medium_niche ?? []).map((h: any) => h.tag).join(', ')}
- Locales: ${(hashtags.local ?? []).map((h: any) => h.tag).join(', ')}
- Fórmula: ${hashtags.usage_formula ?? ''}

${isVideo ? 'IMPORTANTE: Es un REEL/VIDEO — incluir escenas con timestamps y sugerencia de música.' : ''}
${isCarousel ? 'IMPORTANTE: Es un CARRUSEL — incluir estructura de 5-6 slides (título + texto + visual por slide).' : ''}

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "creative_concept": {
    "title": "Título interno descriptivo del concepto",
    "hook": "El gancho principal (idea central que captura atención)",
    "angle": "Ángulo creativo específico para este post",
    "why_this_works": "Por qué este approach funciona para esta audiencia"
  },
  "copy": {
    "caption": "Caption COMPLETO listo para copiar y pegar, con emojis y saltos de línea",
    "first_line": "Solo la primera línea del caption (el hook — máx 125 caracteres)",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "first_comment": "Comentario para publicar inmediatamente después del post (incentiva engagement)"
  },
  "visual": {
    "shot_type": "Ej: Close-up cenital (90° desde arriba)",
    "subject": "Qué debe estar en la foto/video — muy específico",
    "composition": "Cómo encuadrar: ángulo, qué % ocupa cada elemento, regla de tercios",
    "props": ["elemento 1", "elemento 2", "elemento 3"],
    "lighting": "Tipo (natural/artificial), dirección (lateral/frontal) y mood (bright and airy / moody)",
    "color_palette": "Colores dominantes en palabras: ej 'lavanda suave, blanco, madera cálida'",
    "styling": "Estilo general: cantidad de elementos, mood estético, referencias"${videoSchema}${carouselSchema}
  },${musicSection}
  "seo": {
    "primary_keyword": "keyword principal del post",
    "alt_text": "Alt text completo para accesibilidad y SEO (descripción de la imagen para Google)",
    "location_tag": "Nombre exacto de la ubicación a etiquetar en Instagram/Facebook"
  },
  "publishing": {
    "optimal_time": "${post.best_time}",
    "facebook_caption": "Versión adaptada para Facebook — más conversacional, termina con pregunta al público"
  },
  "tips": {
    "pro_tips": ["tip accionable 1", "tip accionable 2", "tip accionable 3"],
    "avoid": ["qué no hacer 1", "qué no hacer 2"],
    "engagement_boosters": ["táctica de engagement 1", "táctica 2", "táctica 3"]
  }
}

REGLAS CRÍTICAS:
- Todo en español
- Caption COMPLETO — no es un borrador, el usuario lo copia y pega directo
- Indicaciones visuales MUY ESPECÍFICAS (el usuario no es fotógrafo profesional — dile exactamente qué hacer)
- Keywords integradas NATURALMENTE en el copy (no forzado)
- Hashtags: seleccioná 12-15 del pool según la fórmula + 1-2 específicos del post
- Mantené el brand voice (do_say / dont_say)
- Sé específico para este negocio — NADA genérico`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, post, brand_strategy, business_brief } = await request.json()
  if (!org_id || !post || !brand_strategy || !business_brief) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const anthropic = getAnthropicClient()

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: BRIEFING_PROMPT(post, brand_strategy, business_brief) }],
    })

    const text = res.content[0]?.type === 'text' ? res.content[0].text : ''
    const briefing = parseJSON(text)

    if (!briefing) return NextResponse.json({ error: 'No se pudo generar el briefing' }, { status: 500 })

    await supabase.from('post_briefings').upsert({
      org_id,
      post_id: post.id,
      briefing_data: briefing,
      status: 'briefed',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id,post_id' })

    return NextResponse.json({ briefing })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error generando briefing' }, { status: 500 })
  }
}
