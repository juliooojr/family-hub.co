import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>
}) {
  const { erro, next } = await searchParams
  const params = new URLSearchParams()

  if (erro) params.set('erro', erro)
  if (next?.startsWith('/') && !next.startsWith('//')) params.set('next', next)

  redirect(params.size > 0 ? `/?${params.toString()}` : '/')
}
