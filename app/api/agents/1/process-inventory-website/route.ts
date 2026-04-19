import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'
import type { InventoryExtraction } from '@/lib/supabase/types'

export const maxDuration = 30

const WEBSITE_EXTRACTION_PROMPT = (url: string, businessName: string, industry: string) => `
Analizá este sitio web y extraé información de productos/servicios.

URL: ${url}
Negocio: ${businessName}
Tipo: ${industry}

Del HTML a continuación, buscá:
- Páginas de menú, productos, servicios, catálogo
- Productos o servicios destacados como "popular", "bestseller", "favorito", "especial"
- Opciones dietéticas o especiales (vegano, sin gluten, etc.)

Extraé SOLO:
1. Categorías principales (máximo 6)
2. Productos/servicios destacados (máximo 3)
3. Atributos especiales
4. Una observación breve

Respondé ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "categories": [],
  "signature_items": [],
  "special_attributes": [],
  "observations": ""
}
`

function parseExtraction(text: string): InventoryExtraction {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      categories: parsed.categories ?? [],
      signature_items: parsed.signature_items ?? [],
      special_attributes: parsed.special_attributes ?? [],
      observations: parsed.observations ?? '',
    }
  } catch {
    return { categories: [], signature_items: [], special_attributes: [], observations: '' }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, business_context } = await request.json()
  if (!url || !business_context) {
    return NextResponse.json({ error: 'Missing url or business_context' }, { status: 400 })
  }

  const normalized = url.startsWith('http') ? url : `https://${url}`

  let html = ''
  try {
    const res = await fetch(normalized, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SofiaBot/1.0)' },
    })
    if (!res.ok) return NextResponse.json({ error: `Site returned ${res.status}` }, { status: 400 })
    const full = await res.text()
    html = full.slice(0, 15000)
  } catch (err: any) {
    return NextResponse.json({ error: 'Could not fetch website', detail: err?.message }, { status: 400 })
  }

  const anthropic = getAnthropicClient()
  const prompt = WEBSITE_EXTRACTION_PROMPT(normalized, business_context.name, business_context.industry)

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nHTML DEL SITIO:\n${html}`,
      }],
    })
    responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  const extraction = parseExtraction(responseText)
  return NextResponse.json({ extraction, url: normalized })
}
