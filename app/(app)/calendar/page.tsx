import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  let orgId = cookieStore.get('active_org_id')?.value

  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!member) redirect('/signup')
    orgId = member.org_id
  }

  const { data: session } = await supabase
    .from('intake_sessions')
    .select('id, business_brief')
    .eq('org_id', orgId!)
    .not('business_brief', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!session?.business_brief) redirect('/intake')

  const { data: strategyRow } = await supabase
    .from('brand_strategies')
    .select('strategy_data')
    .eq('org_id', orgId!)
    .single()

  if (!strategyRow?.strategy_data) redirect('/strategy')

  const { data: setupStatus } = await supabase
    .from('setup_status')
    .select('completed_platforms')
    .eq('org_id', orgId!)
    .single()

  const platforms: string[] = setupStatus?.completed_platforms ?? ['instagram', 'google_business']

  const { data: existing } = await supabase
    .from('content_calendars')
    .select('calendar_data')
    .eq('org_id', orgId!)
    .single()

  return (
    <CalendarClient
      orgId={orgId!}
      sessionId={session.id}
      businessBrief={session.business_brief}
      brandStrategy={strategyRow.strategy_data}
      platforms={platforms}
      initialCalendar={existing?.calendar_data ?? null}
    />
  )
}
