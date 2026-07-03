import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTHORIZED_EMAILS = new Set([
  'juliojr0410@gmail.com',
  'carolinneagro@gmail.com',
])

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname.startsWith('/auth/callback')

  if (!user && !isPublicRoute) {
    const homeUrl = new URL('/', request.url)
    homeUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(homeUrl)
  }

  if (user && !AUTHORIZED_EMAILS.has(user.email?.toLowerCase() ?? '')) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/?erro=nao-autorizado', request.url))
  }

  if (user && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/hub', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
