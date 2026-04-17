import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/login`)

  // Collect cookies set by Supabase so we can apply them to the redirect response
  const cookiesToForward: Array<{ name: string; value: string; options: any }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToForward.push(...cookiesToSet)
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?error=oauth`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login?error=oauth`)

  // Check if user already has an org
  const { data: member } = await supabase
    .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()

  if (member) {
    // Returning user — go straight to dashboard
    const res = NextResponse.redirect(`${origin}/dashboard`)
    cookiesToForward.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    res.cookies.set('active_org_id', member.org_id, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
    return res
  }

  // New OAuth user — create a draft org using service role (bypasses RLS)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mi negocio'
  const { data: org } = await admin
    .from('organizations')
    .insert({ name: displayName, slug: slugify(displayName) })
    .select().single()

  if (org) {
    await admin.from('organization_members').insert({ org_id: org.id, user_id: user.id, role: 'owner' })
    const res = NextResponse.redirect(`${origin}/onboarding?setup=1`)
    cookiesToForward.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    res.cookies.set('active_org_id', org.id, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
    return res
  }

  // Fallback: org creation failed, still forward session cookies
  const res = NextResponse.redirect(`${origin}/onboarding?setup=1`)
  cookiesToForward.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
  return res
}
