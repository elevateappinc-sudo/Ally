import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const orgId = cookieStore.get('active_org_id')?.value

  // If no orgId, they came via Google OAuth — need to create org first
  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!member) redirect('/signup') // Force proper signup flow
    // Set the cookie for them
  }

  // Check if already onboarded
  if (orgId) {
    const { data: existing } = await supabase
      .from('onboarding_data').select('id').eq('org_id', orgId).single()
    if (existing) redirect('/dashboard')
  }

  return <OnboardingClient orgId={orgId!} />
}
