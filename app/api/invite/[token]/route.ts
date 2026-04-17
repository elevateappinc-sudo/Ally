import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invitation
  const { data: invite } = await supabase
    .from('org_invitations').select('*').eq('token', token).single()

  if (!invite) {
    return new NextResponse(
      `<html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;padding:40px"><h2>Invitación inválida o expirada</h2></div></body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url))
  }

  if (!user) {
    return NextResponse.redirect(new URL(`/signup?invite=${token}`, request.url))
  }

  // Accept invitation
  await supabase.from('organization_members').upsert({
    org_id: invite.org_id, user_id: user.id, role: invite.role,
  })
  // Clean up token
  await supabase.from('org_invitations').delete().eq('token', token)

  // Redirect to dashboard with active_org_id cookie set
  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set('active_org_id', invite.org_id, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  return response
}
