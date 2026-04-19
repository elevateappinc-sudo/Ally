import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, session_id, completed_platforms, optimized_content } = await request.json()

  const { error } = await supabase.from('setup_status').upsert({
    org_id,
    session_id,
    completed_platforms,
    optimized_content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id' })

  if (error) {
    console.error('[save-setup-status]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
