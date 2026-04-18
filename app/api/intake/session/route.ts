import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  const orgId = cookieStore.get('active_org_id')?.value
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 })

  // Check for existing active session
  const { data: existing } = await supabase
    .from('intake_sessions')
    .select('id, conversation_history, status')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    return NextResponse.json({ sessionId: existing.id, resumed: true, conversationHistory: existing.conversation_history })
  }

  const { data: session, error } = await supabase
    .from('intake_sessions')
    .insert({ org_id: orgId, user_id: user.id })
    .select('id')
    .single()

  if (error || !session) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })

  return NextResponse.json({ sessionId: session.id, resumed: false, conversationHistory: [] })
}
