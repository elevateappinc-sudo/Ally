import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const GENERATION_PROMPT = (brief: any) => `
Generá contenido optimizado para perfiles de redes sociales para este negocio.

BRIEF DEL NEGOCIO:
Nombre: ${brief.business_info?.name ?? ''}
Industria: ${brief.business_info?.industry ?? ''}
Ubicación: ${brief.business_info?.location ?? ''}
Productos/Servicios: categorías: ${(brief.products_services_basic?.categories ?? []).join(', ')}
Producto estrella: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}
Atributos especiales: ${(brief.products_services_basic?.special_attributes ?? []).join(', ')}
Objetivo principal: ${brief.objectives?.primary_goal ?? ''}

Generá contenido para LAS 4 plataformas. Respondé ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "instagram": {
    "display_name": "nombre del negocio + keyword de ubicación, máx 30 caracteres",
    "bio": "4 líneas: qué hacés | diferenciador o producto estrella | opciones especiales | ubicación + horario abreviado + CTA. Máx 150 caracteres total. 1-2 emojis relevantes.",
    "category": "categoría de negocio más apropiada en Instagram"
  },
  "facebook": {
    "page_name": "nombre del negocio, máx 75 caracteres",
    "short_description": "máx 255 caracteres, incluir keywords locales para SEO",
    "long_description": "máx 500 caracteres, historia del negocio + valores + diferenciadores",
    "cta_button": "uno exacto de: CONTACT_US | CALL_NOW | BOOK_NOW | SHOP_NOW | LEARN_MORE"
  },
  "google_business": {
    "description": "máx 750 caracteres, incluir: qué hacés, productos top, diferenciadores, keywords locales con barrio y ciudad",
    "primary_category": "categoría principal de Google Business más específica",
    "secondary_categories": ["hasta 5 categorías adicionales relevantes"],
    "attributes": ["atributos relevantes: WiFi disponible, Acepta tarjetas de crédito, Opciones veganas, etc"]
  },
  "tiktok": {
    "display_name": "nombre corto y memorable, máx 30 caracteres",
    "bio": "máx 80 caracteres, directo y con personalidad para audiencia joven",
    "category": "categoría más apropiada en TikTok"
  }
}

REGLAS:
- Todo el contenido en español
- Incluir keywords locales donde aplique (barrio + ciudad)
- Específico para este negocio, nada genérico
- Optimizado para búsqueda local
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
      max_tokens: 1500,
      messages: [{ role: 'user', content: GENERATION_PROMPT(business_brief) }],
    })
    responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  try {
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const content = JSON.parse(cleaned)
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: responseText }, { status: 500 })
  }
}
