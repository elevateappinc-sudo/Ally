import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'

export async function POST(request: Request) {
  const { orgId } = await request.json()
  if (!orgId) return Response.json({ error: 'Missing orgId' }, { status: 400 })

  const supabase = await createClient()

  // Fetch onboarding data
  const { data: onboarding, error: onboardingError } = await supabase
    .from('onboarding_data').select('*').eq('org_id', orgId).single()

  if (onboardingError || !onboarding) {
    return Response.json({ error: 'Onboarding not found' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]

  const prompt = `Eres Sofía, estratega de marketing digital experta.

INFORMACIÓN DEL CLIENTE:
- Negocio: ${onboarding.business}
- Problema principal: ${onboarding.pain_point}
- Redes sociales: ${onboarding.social_url || 'No tiene actualmente'}
- Tiempo disponible: ${onboarding.time_commitment}
- Fecha de inicio: ${today}

TAREA: Genera una estrategia de contenido para los próximos 30 días a partir de hoy.

ESTRUCTURA (responde SOLO en JSON sin markdown):
{
  "pillars": { "education": 40, "behind_scenes": 25, "social_proof": 20, "sales": 15 },
  "frequency": "4x/week",
  "platforms": ["instagram"],
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "type": "carousel",
      "pillar": "education",
      "caption": "Caption completo con emojis, hashtags y CTA",
      "visual_brief": "Descripción específica de qué mostrar visualmente",
      "hashtags": ["#marketing"],
      "best_time": "10:00"
    }
  ],
  "reasoning": "Breve explicación de por qué esta estrategia"
}

REGLAS:
- Genera entre 16 y 20 posts distribuidos uniformemente en las 4 semanas
- Captions auténticos y específicos para el negocio, no genéricos
- Visual briefs concretos y accionables
- Responde ÚNICAMENTE con JSON válido, sin bloques de código`

  const anthropic = getAnthropicClient()
  let strategyData: any

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    strategyData = JSON.parse(text)
  } catch {
    // Retry once
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      strategyData = JSON.parse(text)
    } catch {
      return Response.json({ error: 'Strategy generation failed' }, { status: 500 })
    }
  }

  // Save strategy
  const { data: strategy, error: strategyError } = await supabase
    .from('marketing_strategies')
    .insert({
      org_id: orgId,
      onboarding_id: onboarding.id,
      pillars: strategyData.pillars,
      frequency: strategyData.frequency,
      platforms: strategyData.platforms,
      reasoning: strategyData.reasoning,
    })
    .select().single()

  if (strategyError || !strategy) {
    return Response.json({ error: 'Failed to save strategy' }, { status: 500 })
  }

  // Bulk insert posts
  const posts = strategyData.posts.map((p: any) => ({
    org_id: orgId,
    strategy_id: strategy.id,
    post_date: p.date,
    post_type: p.type,
    pillar: p.pillar,
    caption: p.caption,
    visual_brief: p.visual_brief,
    hashtags: p.hashtags,
    best_time: p.best_time,
    status: 'pending',
  }))

  const { error: postsError } = await supabase.from('content_calendar').insert(posts)
  if (postsError) return Response.json({ error: 'Failed to save posts' }, { status: 500 })

  return Response.json({ success: true, strategyId: strategy.id })
}
