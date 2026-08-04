import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getRequestOrigin } from '@/lib/request-origin'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const origin = getRequestOrigin(request)
  const code = searchParams.get('code')
  const requestedPath = searchParams.get('next') ?? request.cookies.get('fh-auth-next')?.value
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
      response.cookies.delete('fh-auth-next')
      return response
    }
  }

  const response = NextResponse.redirect(`${origin}/?erro=auth`)
  response.cookies.delete('fh-auth-next')
  return response
}
