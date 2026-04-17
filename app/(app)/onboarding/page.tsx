import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const orgId = cookieStore.get('active_org_id')?.value
  if (!orgId) redirect('/signup')

  // Check if already onboarded
  const { data: existing } = await supabase
    .from('onboarding_data').select('id').eq('org_id', orgId).single()
  if (existing) redirect('/dashboard')

  const params = await searchParams
  const needsSetup = params.setup === '1'

  return <OnboardingClient orgId={orgId} needsSetup={needsSetup} />
}
