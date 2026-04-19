import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'
import type { InventoryExtraction } from '@/lib/supabase/types'

export const maxDuration = 60

const EXTRACTION_PROMPT = (businessName: string, industry: string, location: string) => `
Analizá este documento que contiene el menú o catálogo de un negocio.

CONTEXTO:
- Negocio: ${businessName}
- Tipo: ${industry}
- Ubicación: ${location}

TAREA: Extraé SOLO lo siguiente (no necesito todo el detalle):

1. CATEGORÍAS PRINCIPALES: ¿Qué grandes categorías de productos/servicios tiene? Ej: "Bebidas calientes", "Comida", "Retail"
2. PRODUCTOS DESTACADOS: ¿Hay algún producto marcado como especial, estrella, popular, o favorito? Máximo 3.
3. OPCIONES ESPECIALES: ¿Menciona vegano, sin gluten, sin azúcar, orgánico, etc?
4. OBSERVACIONES: Cualquier dato notable (precios altos/bajos, temporada, etc.)

Respondé ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "categories": ["Bebidas calientes", "Comida", "Retail"],
  "signature_items": ["Latte de Lavanda con Miel"],
  "special_attributes": ["Leches vegetales disponibles", "Opciones veganas"],
  "observations": "Menú mid-range enfocado en café artesanal."
}

IMPORTANTE: Solo categorías generales, no listes cada item. Máximo 3 signature_items.
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

  const { session_id, storage_path, file_type, business_context } = await request.json()

  if (!storage_path || !file_type || !business_context) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('intake-documents')
    .download(storage_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Failed to download file', detail: downloadError?.message }, { status: 500 })
  }

  const buffer = await fileData.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const anthropic = getAnthropicClient()
  const prompt = EXTRACTION_PROMPT(
    business_context.name,
    business_context.industry,
    business_context.location
  )

  let responseText = ''
  try {
    if (file_type === 'pdf') {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            { type: 'text', text: prompt },
          ],
        }],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    } else {
      const mediaType = storage_path.toLowerCase().endsWith('.png') ? 'image/png' as const : 'image/jpeg' as const
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  const extraction = parseExtraction(responseText)
  return NextResponse.json({ extraction, session_id })
}
