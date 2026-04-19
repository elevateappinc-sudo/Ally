import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { getStrategy } from '@/lib/strategies'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { strategy_id, mode, brand } = body

  const strategy = getStrategy(strategy_id)
  if (!strategy) return NextResponse.json({ error: 'Estrategia no encontrada' }, { status: 400 })

  const modeLabel = mode === 'autopilot'
    ? 'automatizado (listo para ejecutar directamente)'
    : 'copilot (completo y listo para que el usuario lo ejecute manualmente)'

  const brandContext = `
Marca: ${brand.name}
Industria: ${brand.industry ?? 'No especificada'}
Descripción: ${brand.description ?? 'No especificada'}
`

  const prompt = `Eres Ally, un agente de marketing de élite. Vas a ejecutar la estrategia de marketing "${strategy.title}" para la siguiente marca:

${brandContext}

Modo de ejecución: ${modeLabel}

La estrategia tiene ${strategy.steps.length} pasos. Para cada paso, genera el contenido completo, listo para usar. Sin placeholders vacíos ni instrucciones genéricas — todo debe ser específico para esta marca.

${strategy.exampleMessage ? `Ejemplo de tono: ${strategy.exampleMessage}` : ''}

Genera el contenido en JSON con esta estructura EXACTA (sin markdown):
{
  "steps": {
${strategy.steps.map(s => `    "${s.id}": "Contenido completo y listo para usar del paso: ${s.title}. ${s.description}"`).join(',\n')}
  }
}

REGLAS CRÍTICAS:
- Todo en español
- Contenido 100% específico para ${brand.name} — nunca genérico
- Listo para copiar y pegar directamente
- Si es un mensaje (DM, email), debe estar redactado completamente
- Si son listas o pasos, usar formato de texto claro (sin markdown, sin asteriscos)
- Si son múltiples ítems (ej: 5 posts, 10 scripts), numerarlos claramente`

  try {
    const anthropic = getAnthropicClient()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { text: string }).text
    let parsed: { steps: Record<string, string> }
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { steps: {} }
    }

    return NextResponse.json({ ok: true, steps: parsed.steps })
  } catch (err) {
    console.error('[strategies/execute]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
