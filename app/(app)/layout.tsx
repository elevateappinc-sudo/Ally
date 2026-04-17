import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure active_org_id cookie is set
  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get('active_org_id')?.value
  if (!activeOrgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!member) redirect('/signup')
    // Cookie is set by middleware on next request; let it proceed
  }

  return <>{children}</>
}
