import LoginForm from '@/components/auth/LoginForm'

const ERROR_MESSAGES: Record<string, string> = {
  auth: 'Não foi possível concluir o login. Tente novamente.',
  'nao-autorizado': 'Este e-mail ainda não tem acesso ao Family Hub.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
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
    <LoginForm
      googleEnabled={googleEnabled}
      initialError={ERROR_MESSAGES[erro ?? ''] ?? ''}
    />
  )
}
