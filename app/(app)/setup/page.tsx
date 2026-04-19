import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SetupClient } from './SetupClient'

export default async function SetupPage() {
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

  // Get latest intake session that has a business_brief (complete or any status)
  const { data: session } = await supabase
    .from('intake_sessions')
    .select('id, business_brief')
    .eq('org_id', orgId!)
    .not('business_brief', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!session?.business_brief) redirect('/dashboard')

  return <SetupClient orgId={orgId!} sessionId={session.id} businessBrief={session.business_brief} />
}
