import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const orgId = cookieStore.get('active_org_id')?.value
  if (!orgId) redirect('/onboarding')

  // Check onboarding done
  const { data: onboarding } = await supabase
    .from('onboarding_data').select('id').eq('org_id', orgId).single()
  if (!onboarding) redirect('/onboarding')

  // Fetch all posts
  const { data: posts } = await supabase
    .from('content_calendar').select('*').eq('org_id', orgId).order('post_date')

  const { data: org } = await supabase
    .from('organizations').select('name').eq('id', orgId).single()

  return <DashboardClient posts={posts ?? []} orgId={orgId} orgName={org?.name ?? ''} />
}
