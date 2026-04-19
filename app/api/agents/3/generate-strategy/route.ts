import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export const maxDuration = 120

function parseJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

const RESEARCH_PROMPT = (brief: any) => `
Sos un analista de marketing. Analizá el contexto competitivo e identificá keywords y hashtags para este negocio.

NEGOCIO:
Nombre: ${brief.business_info?.name ?? ''}
Industria: ${brief.business_info?.industry ?? ''}
Ubicación: ${brief.business_info?.location ?? ''}
Productos destacados: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}
Atributos especiales: ${(brief.products_services_basic?.special_attributes ?? []).join(', ')}
Objetivo: ${brief.objectives?.primary_goal ?? ''}

COMPETIDORES MENCIONADOS POR EL CLIENTE:
${(brief.competitors ?? []).map((c: any) => `- ${c.name}: fortalezas percibidas: ${c.perceived_strengths}, debilidades percibidas: ${c.perceived_weaknesses}`).join('\n') || 'Ninguno mencionado. Identificá los principales competidores típicos de esta industria y ubicación.'}

TAREAS — usá web_search para cada una:

1. COMPETIDORES: Para cada competidor mencionado (o los 2-3 principales de la industria/zona), buscá "[nombre] [ciudad]" y sus Google reviews. Validá qué dicen los clientes realmente.

2. KEYWORDS LOCALES: Buscá "mejor [industria] [barrio]" y "[producto estrella] [ciudad]" — mirá autocomplete y "People also ask" para encontrar qué busca la gente localmente.

3. HASHTAGS: Buscá qué hashtags usan cafeterías/negocios similares exitosos en Instagram. Encontrá branded, large niche, medium niche y locales.

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "competitors_validated": [
    {
      "name": "",
      "positioning": "cómo se posicionan realmente",
      "pricing_tier": "budget|mid-range|premium|luxury",
      "strengths": ["fortaleza confirmada 1", "fortaleza 2"],
      "weaknesses": ["debilidad confirmada 1", "debilidad 2"],
      "opportunity": "oportunidad específica que tiene el cliente vs este competidor"
    }
  ],
  "keywords": {
    "primary": [
      {"keyword": "keyword local específico", "priority": "high|medium|low", "where_to_use": ["Google Business", "Instagram bio"]}
    ],
    "secondary": ["keyword secundario 1", "keyword 2"],
    "location": ["barrio + producto", "ciudad + producto"]
  },
  "hashtags": {
    "branded": ["#NombreNegocio", "#NombreNegocioCiudad"],
    "large_niche": [{"tag": "#hashtag", "why": "por qué usarlo"}],
    "medium_niche": [{"tag": "#hashtag", "why": "por qué usarlo"}],
    "local": [{"tag": "#hashtag", "why": "por qué usarlo"}],
    "usage_formula": "2 branded + 3 large + 5 medium + 3 local + 2 específicos del post"
  }
}
`

const RESEARCH_PROMPT_NO_SEARCH = (brief: any) => `
Sos un analista de marketing. Basándote en tu conocimiento de mercado, analizá el contexto competitivo e identificá keywords y hashtags para este negocio.

NEGOCIO:
Nombre: ${brief.business_info?.name ?? ''}
Industria: ${brief.business_info?.industry ?? ''}
Ubicación: ${brief.business_info?.location ?? ''}
Productos destacados: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}
Atributos especiales: ${(brief.products_services_basic?.special_attributes ?? []).join(', ')}
Objetivo: ${brief.objectives?.primary_goal ?? ''}

COMPETIDORES MENCIONADOS:
${(brief.competitors ?? []).map((c: any) => `- ${c.name}: fortalezas: ${c.perceived_strengths}, debilidades: ${c.perceived_weaknesses}`).join('\n') || 'Ninguno. Identificá los competidores típicos de esta industria y zona.'}

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "competitors_validated": [
    {
      "name": "",
      "positioning": "",
      "pricing_tier": "budget|mid-range|premium|luxury",
      "strengths": [],
      "weaknesses": [],
      "opportunity": ""
    }
  ],
  "keywords": {
    "primary": [{"keyword": "", "priority": "high|medium|low", "where_to_use": []}],
    "secondary": [],
    "location": []
  },
  "hashtags": {
    "branded": [],
    "large_niche": [{"tag": "", "why": ""}],
    "medium_niche": [{"tag": "", "why": ""}],
    "local": [{"tag": "", "why": ""}],
    "usage_formula": "2 branded + 3 large + 5 medium + 3 local + 2 específicos del post"
  }
}
`

const STRATEGY_PROMPT = (brief: any, research: any) => `
Sos un estratega de marca senior. Creá una estrategia de marca completa y específica para este negocio.

BRIEF DEL NEGOCIO:
${JSON.stringify(brief, null, 2)}

RESEARCH (análisis competitivo, keywords, hashtags):
${JSON.stringify(research, null, 2)}

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "positioning": {
    "statement": "El único [tipo específico de negocio] en [área concreta] que [diferenciador único y defendible]",
    "target_audience": "Descripción muy específica del cliente ideal (edad, ocupación, valores, dónde vive)",
    "value_proposition": "Por qué elegirte vs la competencia, en 2 frases directas",
    "key_differentiators": ["diferenciador defensible 1", "diferenciador 2", "diferenciador 3"]
  },
  "brand_voice": {
    "archetype": "Nombre del arquetipo (ej: The Expert Friend, The Artisan, The Explorer)",
    "archetype_description": "Qué significa este arquetipo para este negocio específico",
    "tone_attributes": ["atributo 1", "atributo 2", "atributo 3", "atributo 4"],
    "do_say": ["ejemplo concreto de cómo hablar 1", "ejemplo 2", "ejemplo 3"],
    "dont_say": ["ejemplo concreto de qué evitar 1", "ejemplo 2", "ejemplo 3"],
    "formality": "tú",
    "emoji_usage": "moderate|minimal|none",
    "technical_terms": "explain|assume_knowledge"
  },
  "content_pillars": [
    {
      "name": "Nombre del pilar",
      "purpose": "Por qué existe este pilar estratégicamente",
      "percentage": 30,
      "example_topics": ["tema concreto 1", "tema 2", "tema 3", "tema 4"]
    }
  ],
  "key_messages": {
    "primary": "El mensaje #1 que SIEMPRE comunicar (derivado del positioning)",
    "secondary": ["mensaje de soporte 1", "mensaje 2", "mensaje 3"],
    "proof_points": ["evidencia concreta que respalda los mensajes 1", "evidencia 2", "evidencia 3"]
  },
  "visual_guidelines": {
    "color_palette": ["color principal con descripción", "color secundario", "color acento"],
    "photography_style": "Descripción específica del estilo fotográfico",
    "aesthetic": "Descripción del estilo visual general y mood"
  },
  "executive_summary": {
    "main_insight": "La conclusión más importante del análisis en 1-2 frases contundentes",
    "biggest_opportunity": "La oportunidad de mercado más grande y específica identificada",
    "recommended_focus": "En qué enfocarse los próximos 90 días (muy concreto)",
    "success_metrics": ["métrica medible 1", "métrica 2", "métrica 3", "métrica 4"]
  }
}

REGLAS CRÍTICAS:
- Todo en español
- SER MUY ESPECÍFICO — nada genérico que sirva para cualquier negocio
- Content pillars deben sumar exactamente 100%
- Mínimo 4, máximo 6 content pillars
- Diferenciadores deben ser DEFENDIBLES (competencia no puede copiarlos fácilmente)
- Basarse en datos reales del brief, no en suposiciones
`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, session_id, business_brief } = await request.json()
  if (!org_id || !business_brief) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const encoder = new TextEncoder()
  let streamController: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(c) { streamController = c },
  })

  const send = (data: object) => {
    try {
      streamController!.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch {}
  }

  ;(async () => {
    const anthropic = getAnthropicClient()

    try {
      // Phase 1: Research with web_search, fallback to no search
      send({ type: 'progress', progress: 10, message: 'Investigando competidores y mercado local...' })

      let research: any = null
      try {
        const researchRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          tools: [{ type: 'web_search_20250305' } as any],
          messages: [{ role: 'user', content: RESEARCH_PROMPT(business_brief) }],
        })
        const textBlocks = researchRes.content.filter((b: any) => b.type === 'text')
        const lastText = textBlocks.at(-1)
        if (lastText?.type === 'text') research = parseJSON(lastText.text)
      } catch {
        // Web search unavailable — use Claude's market knowledge
        send({ type: 'progress', progress: 20, message: 'Analizando mercado y competidores...' })
        const fallbackRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: RESEARCH_PROMPT_NO_SEARCH(business_brief) }],
        })
        const text = fallbackRes.content[0]?.type === 'text' ? fallbackRes.content[0].text : ''
        research = parseJSON(text)
      }

      send({ type: 'progress', progress: 55, message: 'Construyendo estrategia de marca...' })

      // Phase 2: Full brand strategy synthesis
      const strategyRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: STRATEGY_PROMPT(business_brief, research) }],
      })
      const strategyText = strategyRes.content[0]?.type === 'text' ? strategyRes.content[0].text : ''
      const strategyData = parseJSON(strategyText)

      if (!strategyData) throw new Error('No se pudo generar la estrategia')

      const fullStrategy = {
        ...strategyData,
        competitive_analysis: research?.competitors_validated ?? [],
        keywords: research?.keywords ?? { primary: [], secondary: [], location: [] },
        hashtags: research?.hashtags ?? { branded: [], large_niche: [], medium_niche: [], local: [], usage_formula: '' },
      }

      send({ type: 'progress', progress: 88, message: 'Guardando estrategia...' })

      await supabase.from('brand_strategies').upsert({
        org_id,
        session_id: session_id ?? null,
        strategy_data: fullStrategy,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' })

      send({ type: 'complete', progress: 100, strategy: fullStrategy })

    } catch (err: any) {
      send({ type: 'error', message: err?.message ?? 'Error generando estrategia' })
    } finally {
      try { streamController!.close() } catch {}
    }
  })()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
