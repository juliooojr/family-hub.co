import Link from 'next/link'
import { redirect } from 'next/navigation'
import { acceptFamilyInvite, getPublicFamilyInvite } from '@/lib/family'
import { createClient } from '@/lib/supabase/server'

const inviteErrorMessages: Record<string, string> = {
  EMAIL_MISMATCH: 'Este convite foi criado para outro e-mail. Entre com a conta Google convidada.',
  INVITE_ACCEPTED: 'Este convite já foi aceito.',
  INVITE_EXPIRED: 'Este convite expirou. Peça um novo link para a família.',
  INVITE_NOT_FOUND: 'Convite não encontrado.',
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ erro?: string }>
}) {
  const { token } = await params
  const { erro } = await searchParams
  const supabase = await createClient()
  const invite = await getPublicFamilyInvite(supabase, token)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!invite) {
    return <InviteShell title="Convite não encontrado" message="Confira se o link foi copiado corretamente." />
  }

  if (invite.acceptedAt) {
    return <InviteShell title="Convite já aceito" message="Este link não pode ser usado novamente." />
  }

  if (invite.expiresAt <= new Date().toISOString()) {
    return <InviteShell title="Convite expirado" message="Peça para a família gerar um novo convite." />
  }

  if (user) {
    let accepted = false
    try {
      await acceptFamilyInvite(supabase, token)
      accepted = true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível aceitar o convite.'
      return (
        <InviteShell
          title="Não foi possível aceitar"
          message={inviteErrorMessages[message] ?? message}
          actionHref="/auth/logout"
          actionLabel="Trocar conta Google"
        />
      )
    }
    if (accepted) redirect('/hub')
  }

  const signInUrl = `/auth/sign-in?next=/convite/${encodeURIComponent(token)}`
  return (
    <InviteShell
      title={`Entrar na ${invite.familyName}`}
      message={`Este convite é individual para ${invite.email}. Entre com o mesmo e-mail do convite.`}
      error={erro ? inviteErrorMessages[erro] ?? 'Não foi possível concluir o convite.' : ''}
      actionHref={signInUrl}
      actionLabel="Entrar com Google"
    />
  )
}

function InviteShell({
  title,
  message,
  error = '',
  actionHref,
  actionLabel,
}: {
  title: string
  message: string
  error?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <main className="public-home light">
      <div className="public-home-app">
        <header className="public-home-top">
          <div className="public-home-logo">FAMILY<span>.</span>HUB</div>
        </header>
        <section className="public-home-wrap" aria-labelledby="invite-title">
          <div className="public-home-card">
            <div className="public-home-kicker">Convite de família</div>
            <h1 id="invite-title">{title}</h1>
            <p>{message}</p>
            {error ? <div className="error-banner" role="alert">{error}</div> : null}
            <div className="public-home-actions">
              {actionHref && actionLabel ? <Link className="public-home-btn primary" href={actionHref}>{actionLabel}</Link> : null}
              <Link className="public-home-btn ghost" href="/">Voltar</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
