import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  let orgId = cookieStore.get('active_org_id')?.value

  // If cookie is missing, recover it from DB
  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()
    if (!member) redirect('/onboarding')
    orgId = member.org_id!
    try {
      cookieStore.set('active_org_id', orgId!, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: false,
      })
    } catch {}
  }

  // Check onboarding done
  const { data: onboarding } = await supabase
    .from('onboarding_data').select('id').eq('org_id', orgId).single()
  if (!onboarding) redirect('/onboarding')

  // Fetch all posts
  const { data: posts } = await supabase
    .from('content_calendar').select('*').eq('org_id', orgId).order('post_date')

  const { data: org } = await supabase
    .from('organizations').select('name').eq('id', orgId).single()

  return <DashboardClient posts={posts ?? []} orgId={orgId!} orgName={org?.name ?? ''} />
}
