import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  let orgId = cookieStore.get('active_org_id')?.value

  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'No org' }, { status: 400 })
    orgId = member.org_id
  }

  // Mark any previous active sessions as abandoned
  await supabase
    .from('intake_sessions')
    .update({ status: 'abandoned' })
    .eq('org_id', orgId)
    .eq('status', 'active')

  const { data: session, error } = await supabase
    .from('intake_sessions')
    .insert({ org_id: orgId, user_id: user.id })
    .select('id')
    .single()

  if (error || !session) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })

  return NextResponse.json({ sessionId: session.id, conversationHistory: [] })
}
