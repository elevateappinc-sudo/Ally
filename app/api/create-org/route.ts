import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Don't create a duplicate org if user already has one
  const { data: existing } = await supabase
    .from('organization_members').select('org_id').eq('user_id', user.id).limit(1).single()
  if (existing) {
    const cookieStore = await cookies()
    cookieStore.set('active_org_id', existing.org_id, {
      path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', httpOnly: false,
    })
    return NextResponse.json({ orgId: existing.org_id })
  }

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: org, error } = await admin
    .from('organizations')
    .insert({ name: name.trim(), slug: slugify(name.trim()) })
    .select().single()

  if (error || !org) return NextResponse.json({ error: 'Error al crear organización' }, { status: 500 })

  await admin.from('organization_members').insert({ org_id: org.id, user_id: user.id, role: 'owner' })

  const cookieStore = await cookies()
  cookieStore.set('active_org_id', org.id, {
    path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', httpOnly: false,
  })

  return NextResponse.json({ orgId: org.id })
}
