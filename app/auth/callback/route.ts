import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/login`)

  // Use cookies() from next/headers (standard Supabase SSR pattern).
  // We also track what Supabase sets so we can copy them explicitly to the
  // redirect response — belt & suspenders, since NextResponse.redirect()
  // creates a fresh response that might not inherit cookieStore mutations.
  const cookieStore = await cookies()
  const newCookies: Array<{ name: string; value: string; options: any }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          newCookies.push(...cookiesToSet)
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?error=oauth`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login?error=oauth`)

  // Determine where to send the user and which org is active
  let redirectTo = `${origin}/dashboard`
  let activeOrgId: string | null = null
  let isNewUser = false

  const { data: member } = await supabase
    .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()

  if (member) {
    activeOrgId = member.org_id
    redirectTo = `${origin}/dashboard`
  } else {
    isNewUser = true
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
      activeOrgId = org.id
    }
    redirectTo = `${origin}/onboarding?setup=1`
  }

  const res = NextResponse.redirect(redirectTo)

  // Explicitly set all Supabase session cookies on the redirect response.
  // This ensures the browser gets them even if cookieStore mutations don't
  // automatically propagate to a NextResponse.redirect().
  newCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options)
  })

  if (activeOrgId) {
    res.cookies.set('active_org_id', activeOrgId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
    })
  }

  return res
}
