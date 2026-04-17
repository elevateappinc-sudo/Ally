import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'

export async function POST(request: Request) {
  const { message, orgId } = await request.json()
  if (!message || !orgId) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = await createClient()

  // Fetch context
  const [{ data: onboarding }, { data: strategy }, { data: pendingPosts }] = await Promise.all([
    supabase.from('onboarding_data').select('*').eq('org_id', orgId).single(),
    supabase.from('marketing_strategies').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('content_calendar').select('*').eq('org_id', orgId).eq('status', 'pending').order('post_date').limit(5),
  ])

  const systemPrompt = `Eres Sofía, consultora de marketing digital de ${onboarding?.business || 'este negocio'}.

CONTEXTO DEL NEGOCIO:
- Negocio: ${onboarding?.business}
- Problema principal: ${onboarding?.pain_point}
- Tiempo disponible: ${onboarding?.time_commitment}
- Plataformas: ${strategy?.platforms?.join(', ')}
- Frecuencia: ${strategy?.frequency}

PRÓXIMOS POSTS PENDIENTES:
${pendingPosts?.map((p: any) => `- ${p.post_date}: ${p.caption.slice(0, 80)}...`).join('\n') || 'Ninguno'}

Responde en español, de forma concisa y práctica. Eres experta y cálida.`

  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return Response.json({ reply })
}
