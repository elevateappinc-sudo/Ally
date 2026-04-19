// app/api/agents/2/analyze-platforms/route.ts
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export const maxDuration = 30

const ANALYZE_PROMPT = (brief: any) => `
Sos un estratega de marketing digital. Analizá este negocio y decidí en qué plataformas debe estar presente.

NEGOCIO:
Nombre: ${brief.business_info?.name ?? ''}
Industria: ${brief.business_info?.industry ?? ''}
Modelo: ${brief.business_info?.business_model ?? ''}
Ubicación: ${brief.business_info?.location ?? ''}
Productos estrella: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}
Atributos especiales: ${(brief.products_services_basic?.special_attributes ?? []).join(', ')}
Objetivo: ${brief.objectives?.primary_goal ?? ''}
Cliente ideal: ${JSON.stringify(brief.customer_profile?.demographics ?? {})}
Marketing actual: ${(brief.current_marketing?.channels ?? []).join(', ')}

PLATAFORMAS DISPONIBLES: instagram, facebook, google_business, tiktok

REGLAS:
- google_business: incluir SIEMPRE si el negocio tiene presencia física o atiende clientes locales
- instagram: incluir si el negocio es visual (comida, moda, servicios estéticos, hogar, arte) o si el cliente es 18-45
- facebook: incluir si el negocio tiene audiencia 30+ o necesita grupos/eventos/marketplace
- tiktok: incluir si el negocio apunta a menores de 35 y puede crear contenido de video corto (entretenimiento, food, lifestyle, fitness)
- Mínimo 2, máximo 4 plataformas
- sofia_message: 2-3 oraciones en español informal (tuteo), cálido y directo. Empezar con "Mirá," o "Buenas noticias:"

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "recommended_platforms": ["instagram", "google_business"],
  "reasoning": {
    "instagram": "razón concreta en 1 oración de por qué esta plataforma encaja",
    "google_business": "razón concreta"
  },
  "sofia_message": "Mirá, basándome en tu negocio de [X] en [Y], las plataformas donde más vas a crecer son [lista]. [Razón principal en 1 oración]. ¡Empecemos a optimizar!"
}
`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { business_brief } = await request.json()
  if (!business_brief) return NextResponse.json({ error: 'Missing business_brief' }, { status: 400 })

  const anthropic = getAnthropicClient()

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: ANALYZE_PROMPT(business_brief) }],
    })
    responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  try {
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)
    return NextResponse.json(result)
  } catch {
    // Fallback: recommend all platforms if parse fails
    return NextResponse.json({
      recommended_platforms: ['instagram', 'facebook', 'google_business', 'tiktok'],
      reasoning: {
        instagram: 'Ideal para mostrar tu negocio visualmente.',
        facebook: 'Amplio alcance para tu audiencia.',
        google_business: 'Esencial para aparecer en búsquedas locales.',
        tiktok: 'Crecimiento orgánico para audiencia joven.',
      },
      sofia_message: 'Mirá, analizando tu negocio, te recomiendo estar en Instagram, Facebook, Google Business y TikTok. Cada una te ayuda a llegar a más clientes. ¡Empecemos!',
    })
  }
}
