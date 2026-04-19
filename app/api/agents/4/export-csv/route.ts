import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('content_calendars')
    .select('calendar_data')
    .eq('org_id', orgId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 })

  const weeks: any[] = (data.calendar_data as any)?.weeks ?? []

  const rows: string[][] = [
    ['Semana', 'Tema', 'Plataforma', 'Fecha', 'Día', 'Pilar', 'Formato', 'Caption', 'Brief Visual', 'Hashtags', 'Mejor Hora', 'CTA'],
  ]

  for (const week of weeks) {
    for (const post of (week.posts ?? [])) {
      rows.push([
        String(week.week),
        week.theme ?? '',
        post.platform ?? '',
        post.date ?? '',
        post.day ?? '',
        post.pillar ?? '',
        post.format ?? '',
        post.caption ?? '',
        post.visual_brief ?? '',
        (post.hashtags ?? []).join(' '),
        post.best_time ?? '',
        post.cta ?? '',
      ])
    }
  }

  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendario-contenido-90-dias.csv"',
    },
  })
}
