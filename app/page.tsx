import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()

  if (!member) redirect('/signup')

  // Ensure active_org_id cookie is always set so downstream pages never lose it
  const cookieStore = await cookies()
  const current = cookieStore.get('active_org_id')?.value
  if (current !== member.org_id) {
    try {
      cookieStore.set('active_org_id', member.org_id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: false,
      })
    } catch {}
  }

  redirect('/dashboard')
}
