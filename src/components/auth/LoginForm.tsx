'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({
  initialError,
  googleEnabled,
}: {
  initialError: string
  googleEnabled: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const error = localError || initialError

  async function signIn() {
    setLoading(true)
    setLocalError('')

    if (!googleEnabled) {
      setLocalError('O login com Google ainda não foi habilitado no Supabase.')
      setLoading(false)
      return
    }

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (callbackUrl.hostname === '0.0.0.0') {
      callbackUrl.hostname = 'localhost'
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })

    if (authError) {
      setLocalError('Não foi possível abrir o login do Google.')
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">FH</div>
        <p className="eyebrow">ESPAÇO PRIVADO DA FAMÍLIA</p>
        <h1 id="login-title" className="display-title">FAMILY<span>.</span>HUB</h1>
        <p className="login-copy">Julio, Carol, Tomás e Flora. Tudo importante em um só lugar.</p>
        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        {!googleEnabled && !error ? (
          <div className="error-banner" role="alert">O login com Google precisa ser habilitado no Supabase.</div>
        ) : null}
        <button className="button button-primary login-button" onClick={signIn} disabled={loading || !googleEnabled}>
          <span className="google-mark">G</span>
          {loading ? 'Abrindo Google...' : 'Entrar com Google'}
        </button>
        <p className="login-security">Acesso restrito aos e-mails autorizados.</p>
      </section>
    </main>
  )
}
