import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
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
  let orgId = cookieStore.get('active_org_id')?.value

  // If cookie is missing, look up the org from DB (handles cases where
  // the cookie wasn't forwarded properly through the OAuth redirect chain)
  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()
    if (!member) redirect('/signup')
    orgId = member.org_id!
    // Repair the cookie for downstream pages
    cookieStore.set('active_org_id', orgId!, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
    })
  }

  // Check if already onboarded
  const { data: existing } = await supabase
    .from('onboarding_data').select('id').eq('org_id', orgId).single()
  if (existing) redirect('/dashboard')

  const params = await searchParams
  const needsSetup = params.setup === '1'

  return <OnboardingClient orgId={orgId!} needsSetup={needsSetup} />
}
