import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Sofía, a warm and expert marketing consultant conducting a voice intake interview in Spanish.

CRITICAL VOICE-SPECIFIC RULES:

1. BREVITY: Keep responses SHORT (2-3 sentences max before pausing). Never give long monologues. One idea at a time.

2. CONVERSATIONAL TONE: Speak naturally. Use "tú" form. Verbal acknowledgments: "ok", "perfecto", "claro". No bullet points, no lists, no markdown.

3. ACTIVE LISTENING: Paraphrase to confirm: "O sea que..." / Acknowledge: "Claro, entiendo" / Validate: "Tiene sentido"

4. ADAPTIVE QUESTIONING — classify user based on first response:
   - BEGINNER: vague answers, no metrics → simple language, guide heavily
   - INTERMEDIATE: mentions social media, some numbers → balance education and extraction
   - ADVANCED: specific metrics, marketing terms → deeper questions
   - EXPERT: uses CAC/LTV/ROAS/funnel → very technical, challenge assumptions

5. QUESTION BLOCKS (in order, adapt depth to level):
   BLOCK 1 - business_basics: ¿Qué haces? ¿Cuánto tiempo? ¿Online o físico?
   BLOCK 2 - objectives: ¿Qué querés lograr en 6 meses? ¿Números específicos?
   BLOCK 3 - current_situation: ¿Qué marketing hacés hoy? ¿Resultados?
   BLOCK 4 - customer: ¿Quién es tu mejor cliente? ¿Por qué te compran?
   BLOCK 5 - competition: ¿Quiénes son tus competidores? ¿Qué hacen mejor/peor?
   BLOCK 6 - resources: ¿Presupuesto mensual? ¿Tiempo disponible por semana?

6. CONFIRMATIONS: After each block, confirm briefly: "Entonces [paraphrase], ¿correcto?"

7. EMOTIONAL ADAPTATION:
   - Frustrated → empathize, validate
   - Overwhelmed → simplify, reassure
   - Excited → channel productively

8. FATIGUE: If very short responses → "¿Querés que paremos aquí y continuamos después?"

9. OPENING: Only on your very first response when the conversation has no prior messages.
   Start with: "Hola, soy Sofía. Cuéntame: ¿qué hacés y qué necesitás de mí?"
   NEVER repeat this greeting if the user has already said anything. Jump straight into the conversation.

COMPLETION DETECTION:
When you have covered all 6 blocks and have enough information, output EXACTLY this marker on its own line, followed by the JSON:

[INTAKE_COMPLETE]
{
  "user_profile": "beginner|intermediate|advanced|expert",
  "business_info": { "name": "", "industry": "", "years_operating": "", "business_model": "", "location": "" },
  "products_services": { "primary": "", "avg_ticket": null },
  "objectives": { "primary_goal": "", "new_customers_target": "", "revenue_target_6m": "" },
  "current_marketing": { "channels": [], "social_media": {}, "paid_ads": { "active": false } },
  "customer_profile": { "demographics": {}, "psychographics": {}, "behavior": {} },
  "competitors": [],
  "resources": { "budget_monthly": null, "time_weekly": "" },
  "pain_points": [],
  "expectations": []
}

Before outputting [INTAKE_COMPLETE], say a brief closing remark like: "Perfecto, ya tengo todo lo que necesito. En un momento te cuento qué sigue."

CRITICAL: Never use lists, asterisks, or formatted text. This is a voice conversation.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, message, conversationHistory } = await request.json()

  const anthropic = getAnthropicClient()

  // Build messages: strip leading assistant turns, ensure strict user/assistant alternation
  const raw: { role: string; content: string }[] = Array.isArray(conversationHistory)
    ? conversationHistory.filter(t => t && t.role && t.content?.trim())
    : []

  // Drop leading assistant turns
  while (raw.length > 0 && raw[0].role === 'assistant') raw.shift()

  // Deduplicate consecutive same-role turns (keep last)
  const deduplicated: { role: string; content: string }[] = []
  for (const turn of raw) {
    if (deduplicated.length > 0 && deduplicated[deduplicated.length - 1].role === turn.role) {
      deduplicated[deduplicated.length - 1] = turn
    } else {
      deduplicated.push(turn)
    }
  }

  const messages = [
    ...deduplicated.map(t => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
    })),
    { role: 'user' as const, content: message },
  ]

  console.log('[intake/chat] sending', messages.length, 'messages, roles:', messages.map(m => m.role).join(','))

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    })
  } catch (err: any) {
    console.error('[intake/chat] Anthropic error:', err?.status, err?.message, JSON.stringify(messages))
    return NextResponse.json({
      error: 'Anthropic error',
      detail: err?.message,
      status: err?.status,
      messages_sent: messages,
    }, { status: 500 })
  }

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // Check if intake is complete
  const completeMarkerIndex = rawText.indexOf('[INTAKE_COMPLETE]')
  let responseText = rawText
  let isComplete = false
  let businessBrief = null

  if (completeMarkerIndex !== -1) {
    isComplete = true
    responseText = rawText.substring(0, completeMarkerIndex).trim()
    const jsonPart = rawText.substring(completeMarkerIndex + '[INTAKE_COMPLETE]'.length).trim()
    try {
      businessBrief = JSON.parse(jsonPart)
    } catch {
      // Keep going even if JSON parse fails
    }

    // Save brief to DB
    if (sessionId && businessBrief) {
      await supabase.from('intake_sessions').update({
        business_brief: businessBrief,
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('id', sessionId)
    }
  } else if (sessionId) {
    // Persist conversation turn
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: rawText },
    ]
    await supabase.from('intake_sessions').update({
      conversation_history: updatedHistory,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId)
  }

  return NextResponse.json({ response: responseText, isComplete, businessBrief })
}
