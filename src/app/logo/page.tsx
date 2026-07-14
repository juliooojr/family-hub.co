import LogoLab from './LogoLab'

export const metadata = {
  title: 'Logo | Family Hub',
}

export default async function LogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; animacao?: string; r?: string }>
}) {
  const params = await searchParams
  const theme = params.tema === 'dark' ? 'dark' : 'light'
  const animation = params.animacao === 'house' ? 'house' : 'full'
  const replayKey = Number(params.r ?? '0')

  return <LogoLab theme={theme} animation={animation} replayKey={Number.isFinite(replayKey) ? replayKey : 0} />
}
