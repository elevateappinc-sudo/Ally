import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, post_id, status } = await request.json()
  if (!org_id || !post_id || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('post_briefings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('org_id', org_id)
    .eq('post_id', post_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
