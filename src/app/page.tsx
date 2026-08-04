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
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return (
    <PublicHome
      googleEnabled={googleEnabled}
      initialError={ERROR_MESSAGES[erro ?? ''] ?? ''}
      nextPath={next?.startsWith('/') && !next.startsWith('//') ? next : '/hub'}
    />
  )
}
