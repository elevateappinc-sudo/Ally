import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { StrategyClient } from './StrategyClient'

export default async function StrategyPage() {
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

  // Get latest intake session with business brief
  const { data: session } = await supabase
    .from('intake_sessions')
    .select('id, business_brief')
    .eq('org_id', orgId!)
    .not('business_brief', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!session?.business_brief) redirect('/intake')

  // Check if strategy already generated (cache)
  const { data: existing } = await supabase
    .from('brand_strategies')
    .select('strategy_data')
    .eq('org_id', orgId!)
    .single()

  return (
    <StrategyClient
      orgId={orgId!}
      sessionId={session.id}
      businessBrief={session.business_brief}
      initialStrategy={existing?.strategy_data ?? null}
    />
  )
}
