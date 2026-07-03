import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function GET(request: NextRequest) {
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
    },
  )

  await supabase.auth.signOut()

  const homeUrl = new URL('/', request.url)
  if (homeUrl.hostname === '0.0.0.0') homeUrl.hostname = 'localhost'

  const response = NextResponse.redirect(homeUrl)
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )
  return response
}
