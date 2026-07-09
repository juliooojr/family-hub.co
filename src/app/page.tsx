import PublicHome from '@/components/auth/PublicHome'

const ERROR_MESSAGES: Record<string, string> = {
  auth: 'Não foi possível concluir o login. Tente novamente.',
  convite: 'Não foi possível aceitar o convite. Confira o link e o e-mail usado no Google.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>
}) {
  const { erro, next } = await searchParams
  let googleEnabled = false

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: 'no-store',
    })
    const settings = await response.json() as { external?: { google?: boolean } }
    googleEnabled = settings.external?.google === true
  } catch {
    googleEnabled = false
  }

  return (
    <PublicHome
      googleEnabled={googleEnabled}
      initialError={ERROR_MESSAGES[erro ?? ''] ?? ''}
      nextPath={next?.startsWith('/') && !next.startsWith('//') ? next : '/hub'}
    />
  )
}
