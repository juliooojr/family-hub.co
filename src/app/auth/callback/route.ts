import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  if (requestUrl.hostname === '0.0.0.0') {
    requestUrl.hostname = 'localhost'
  }
  const origin = requestUrl.origin
  const code = searchParams.get('code')
  const requestedPath = searchParams.get('next')
  const nextPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
    ? requestedPath
    : '/hub'

  if (code) {
    const cookieStore = await cookies()
    const cookiesToSet: CookieToSet[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(nextCookiesToSet) {
            cookiesToSet.push(...nextCookiesToSet)
            nextCookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const response = NextResponse.redirect(new URL(nextPath, origin))
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      )
      return response
    }
  }

  return NextResponse.redirect(`${origin}/?erro=auth`)
}
