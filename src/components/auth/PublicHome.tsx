'use client'

import { useState } from 'react'

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

    const signInUrl = new URL('/auth/sign-in', window.location.origin)
    signInUrl.searchParams.set('next', nextPath)
    window.location.assign(signInUrl.toString())
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
