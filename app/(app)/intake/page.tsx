import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { IntakeClient } from './IntakeClient'

export default async function IntakePage() {
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

  if (!orgId) redirect('/signup')
  return <IntakeClient orgId={orgId} />
}
