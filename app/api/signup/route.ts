import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(request: Request) {
  const { email, password, businessName } = await request.json()

  if (!email || !password || !businessName?.trim()) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create auth user via admin (works regardless of email confirmation setting)
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip confirmation requirement
  })

  if (userError || !userData.user) {
    const msg = userError?.message || 'Error al crear usuario'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = userData.user.id

  // Create org
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: businessName.trim(), slug: slugify(businessName.trim()) })
    .select().single()

  if (orgError || !org) {
    // Rollback user
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Error al crear organización' }, { status: 500 })
  }

  await admin.from('organization_members').insert({
    org_id: org.id, user_id: userId, role: 'owner',
  })

  // Sign user in to get a session
  const { createServerClient } = await import('@supabase/ssr')
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

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    // User and org were created — just couldn't auto-login. Let client handle it.
    return NextResponse.json({ orgId: org.id, needsLogin: true })
  }

  const res = NextResponse.json({ orgId: org.id })
  newCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
  res.cookies.set('active_org_id', org.id, {
    path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', httpOnly: false,
  })
  return res
}
