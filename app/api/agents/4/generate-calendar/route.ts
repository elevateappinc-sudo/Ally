import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export const maxDuration = 180

function parseJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

const PLATFORM_SCHEDULE: Record<string, { offsets: number[]; dayNames: string[] }> = {
  instagram:       { offsets: [0, 2, 4], dayNames: ['Lunes', 'Miércoles', 'Viernes'] },
  facebook:        { offsets: [1, 3],    dayNames: ['Martes', 'Jueves'] },
  google_business: { offsets: [2],       dayNames: ['Miércoles'] },
  tiktok:          { offsets: [1, 4],    dayNames: ['Martes', 'Viernes'] },
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getWeekStartDates(count: number): string[] {
  const today = new Date()
  const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(nextMonday)
    d.setDate(nextMonday.getDate() + i * 7)
    return d.toISOString().split('T')[0]
  })
}

const BATCH_PROMPT = (
  brief: any,
  strategy: any,
  platforms: string[],
  weeks: Array<{ week: number; start_date: string }>
) => {
  const pillars = strategy.content_pillars ?? []
  const voice = strategy.brand_voice ?? {}
  const hashtags = strategy.hashtags ?? {}

  const scheduleLines = weeks.map(w => {
    const platformLines = platforms.map(p => {
      const sched = PLATFORM_SCHEDULE[p]
      if (!sched) return null
      const dates = sched.offsets.map((offset, i) => `${sched.dayNames[i]} ${addDays(w.start_date, offset)}`)
      return `  - ${p}: ${dates.join(', ')}`
    }).filter(Boolean)
    return [`Semana ${w.week} (inicia ${w.start_date}):`, ...platformLines].join('\n')
  }).join('\n\n')

  const formatsByPlatform: Record<string, string> = {
    instagram: 'Carrusel (3-10 slides) | Reel (15-90s) | Post estático',
    facebook: 'Post con imagen | Video corto | Post de texto',
    google_business: 'Actualización | Oferta | Producto destacado',
    tiktok: 'Video 15-30s | Video 60s | Tutorial',
  }

  return `Sos un estratega de contenido digital. Creá el calendario de contenido para las semanas ${weeks[0].week} a ${weeks[weeks.length - 1].week} de un período de 90 días.

NEGOCIO:
- Nombre: ${brief.business_info?.name ?? ''}
- Industria: ${brief.business_info?.industry ?? ''}
- Ubicación: ${brief.business_info?.location ?? ''}
- Productos destacados: ${(brief.products_services_basic?.signature_items ?? []).join(', ')}
- Objetivo: ${brief.objectives?.primary_goal ?? ''}

VOZ DE MARCA:
- Arquetipo: ${voice.archetype ?? ''}
- Tono: ${(voice.tone_attributes ?? []).join(', ')}
- Uso de emojis: ${voice.emoji_usage ?? 'moderate'}
- Hablar así: ${(voice.do_say ?? []).slice(0, 2).join(' | ')}
- Evitar: ${(voice.dont_say ?? []).slice(0, 2).join(' | ')}

PILARES DE CONTENIDO:
${pillars.map((p: any) => `- ${p.name} (${p.percentage}%): ${(p.example_topics ?? []).join(', ')}`).join('\n')}

HASHTAGS:
- De marca: ${(hashtags.branded ?? []).join(', ')}
- Fórmula: ${hashtags.usage_formula ?? ''}
- Nicho grande: ${(hashtags.large_niche ?? []).map((h: any) => h.tag).join(', ')}
- Nicho medio: ${(hashtags.medium_niche ?? []).map((h: any) => h.tag).join(', ')}
- Locales: ${(hashtags.local ?? []).map((h: any) => h.tag).join(', ')}

FECHAS DE PUBLICACIÓN:
${scheduleLines}

PLATAFORMAS Y FORMATOS:
${platforms.map(p => `- ${p}: ${formatsByPlatform[p] ?? ''}`).join('\n')}

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "weeks": [
    {
      "week": 1,
      "start_date": "YYYY-MM-DD",
      "theme": "Tema inspirador de la semana",
      "posts": [
        {
          "id": "w1-instagram-1",
          "platform": "instagram",
          "date": "YYYY-MM-DD",
          "day": "Lunes",
          "pillar": "Nombre del pilar",
          "format": "Carrusel",
          "caption": "Caption completo y específico con emojis según voz de marca",
          "visual_brief": "Descripción detallada para el diseñador: qué mostrar, colores, mood",
          "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
          "best_time": "19:00",
          "cta": "Llamado a la acción específico"
        }
      ]
    }
  ]
}

REGLAS CRÍTICAS:
- Todo en español
- Distribuí los pilares según sus porcentajes (no repetir el mismo dos veces seguidas si hay más disponibles)
- Captions COMPLETOS, no borradores. Incluí emojis según el tono configurado.
- Cada caption termina con el CTA
- Hashtags según la fórmula provista
- Las fechas deben coincidir EXACTAMENTE con las indicadas arriba
- Sé muy específico para este negocio — nada genérico`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, session_id, business_brief, brand_strategy, platforms } = await request.json()
  if (!org_id || !business_brief || !brand_strategy) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const activePlatforms: string[] = Array.isArray(platforms) && platforms.length > 0
    ? platforms.filter((p: string) => PLATFORM_SCHEDULE[p])
    : ['instagram', 'google_business']

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
      send({ type: 'progress', progress: 5, message: 'Planificando tu calendario de 90 días...' })

      const weekStartDates = getWeekStartDates(13)
      const allWeeks = weekStartDates.map((start_date, i) => ({ week: i + 1, start_date }))

      // 3 batches: weeks 1-4, 5-9, 10-13
      const batches = [allWeeks.slice(0, 4), allWeeks.slice(4, 9), allWeeks.slice(9)]
      const batchStartMessages = [
        'Creando contenido semanas 1-4...',
        'Creando contenido semanas 5-9...',
        'Creando contenido semanas 10-13...',
      ]
      const batchStartProgress = [10, 38, 68]
      const batchDoneProgress  = [35, 65, 90]

      const allGeneratedWeeks: any[] = []

      for (let i = 0; i < batches.length; i++) {
        send({ type: 'progress', progress: batchStartProgress[i], message: batchStartMessages[i] })

        const res = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 5000,
          messages: [{ role: 'user', content: BATCH_PROMPT(business_brief, brand_strategy, activePlatforms, batches[i]) }],
        })

        const text = res.content[0]?.type === 'text' ? res.content[0].text : ''
        const parsed = parseJSON(text)
        if (parsed?.weeks) allGeneratedWeeks.push(...parsed.weeks)

        send({ type: 'progress', progress: batchDoneProgress[i], message: i < 2 ? batchStartMessages[i + 1] : 'Guardando calendario...' })
      }

      if (allGeneratedWeeks.length === 0) throw new Error('No se pudo generar el calendario')

      const totalPosts = allGeneratedWeeks.reduce((sum, w) => sum + (w.posts?.length ?? 0), 0)
      const periodStart = allGeneratedWeeks[0]?.start_date ?? null
      const lastWeek = allGeneratedWeeks[allGeneratedWeeks.length - 1]
      const periodEnd = lastWeek ? addDays(lastWeek.start_date, 6) : null

      const calendarData = {
        weeks: allGeneratedWeeks,
        platforms: activePlatforms,
        total_posts: totalPosts,
        period_start: periodStart,
        period_end: periodEnd,
      }

      send({ type: 'progress', progress: 94, message: 'Guardando calendario...' })

      await supabase.from('content_calendars').upsert({
        org_id,
        session_id: session_id ?? null,
        calendar_data: calendarData,
        period_start: periodStart,
        period_end: periodEnd,
        total_posts: totalPosts,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' })

      send({ type: 'complete', progress: 100, calendar: calendarData })

    } catch (err: any) {
      send({ type: 'error', message: err?.message ?? 'Error generando calendario' })
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
