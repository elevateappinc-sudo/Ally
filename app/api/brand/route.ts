import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  let orgId = cookieStore.get('active_org_id')?.value

  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()
    if (!member) return NextResponse.json({ error: 'No org' }, { status: 404 })
    orgId = member.org_id
  }

  const { data: session } = await supabase
    .from('intake_sessions')
    .select('id, business_brief, updated_at')
    .eq('org_id', orgId)
    .not('business_brief', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!session?.business_brief) {
    return NextResponse.json({ error: 'No brand data' }, { status: 404 })
  }

  const brief = session.business_brief as any
  const info = brief.business_info ?? {}

  const brand = {
    id: orgId,
    name: info.name ?? 'Mi negocio',
    description: info.description ?? info.concept ?? '',
    industry: info.industry ?? '',
    website: info.website ?? '',
    color: '#e1306c',
    user_id: user.id,
    created_at: session.updated_at,
    updated_at: session.updated_at,
  }

  return NextResponse.json(brand)
}
