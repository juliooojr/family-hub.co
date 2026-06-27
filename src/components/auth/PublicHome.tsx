'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PublicHome({
  googleEnabled,
  initialError,
  nextPath,
}: {
  googleEnabled: boolean
  initialError: string
  nextPath: string
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const error = localError || initialError

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light')
  }

  async function signIn() {
    setLoading(true)
    setLocalError('')

    if (!googleEnabled) {
      setLocalError('O login com Google ainda não foi habilitado no Supabase.')
      setLoading(false)
      return
    }

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('next', nextPath)
    if (callbackUrl.hostname === '0.0.0.0') callbackUrl.hostname = 'localhost'

    const { data, error: authError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    })

    if (authError || !data.url) {
      setLocalError('Não foi possível abrir o login do Google.')
      setLoading(false)
      return
    }

    const authorizationUrl = new URL(data.url)
    const returnedCallback = authorizationUrl.searchParams.get('redirect_to')

    if (!returnedCallback || new URL(returnedCallback).origin !== callbackUrl.origin) {
      setLocalError(
        `O Supabase não autorizou o retorno para ${callbackUrl.origin}. Adicione ${callbackUrl.origin}/auth/callback às Redirect URLs do projeto.`,
      )
      setLoading(false)
      return
    }

    window.location.assign(authorizationUrl.toString())
  }

  return (
    <main className={`public-home ${theme === 'light' ? 'light' : ''}`}>
      <div className="public-home-app">
        <header className="public-home-top">
          <div className="public-home-logo">FAMILY<span>.</span>HUB</div>
          <button className="public-home-theme" type="button" onClick={toggleTheme}>☀︎ / ☾</button>
        </header>
        <section className="public-home-wrap" aria-labelledby="public-home-title">
          <div className="public-home-card">
            <div className="public-home-kicker">Espaço da família</div>
            <h1 id="public-home-title">
              Toda família tem uma rotina.
              <br />
              Aqui ela encontra seu lugar.
            </h1>
            <p>Tudo o que faz parte da sua casa, reunido de forma simples e organizada.</p>
            {error ? <div className="error-banner" role="alert">{error}</div> : null}
            <div className="public-home-actions">
              <button className="public-home-btn primary" type="button" onClick={signIn} disabled={loading}>
                {loading ? 'Abrindo...' : 'Entrar'}
              </button>
              <button className="public-home-btn ghost" type="button" onClick={toggleTheme}>
                Alternar tema
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
