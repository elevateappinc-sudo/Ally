import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/signup', '/auth/callback', '/auth/done', '/suspended']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // Redirect authenticated users away from login (but NOT signup — OAuth users need it to create an org)
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Require auth for protected pages
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user) return supabaseResponse

  // Admin guard
  if (pathname.startsWith('/admin')) {
    const { data: adminUser } = await supabase
      .from('admin_users').select('user_id').eq('user_id', user.id).single()
    if (!adminUser) return NextResponse.redirect(new URL('/', request.url))
    return supabaseResponse
  }

  // Org active guard (skip for /onboarding and /settings)
  if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/settings')) {
    const activeOrgId = request.cookies.get('active_org_id')?.value
    if (activeOrgId) {
      const { data: org } = await supabase
        .from('organizations').select('is_active').eq('id', activeOrgId).single()
      if (org && !org.is_active && !pathname.startsWith('/suspended')) {
        return NextResponse.redirect(new URL('/suspended', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
