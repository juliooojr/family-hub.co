'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

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

  async function startGoogle(next: string) {
    setLoading(true)
    setLocalError('')

    if (!googleEnabled) {
      setLocalError('O login com Google ainda não foi habilitado no Supabase.')
      setLoading(false)
      return
    }

    const signInUrl = new URL('/auth/sign-in', window.location.origin)
    signInUrl.searchParams.set('next', next)
    window.location.assign(signInUrl.toString())
  }

  return (
    <main className={`public-home ${theme === 'light' ? 'light' : ''}`}>
      <div className="public-home-app">
        <header className="public-home-top">
          <div className="public-home-logo">FAMILY<span>.</span>HUB</div>
          <button className="public-home-theme" type="button" onClick={toggleTheme} aria-label="Alternar tema" title="Alternar tema">{theme === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}</button>
        </header>
        <section className="public-home-wrap" aria-labelledby="public-home-title">
          <div className="public-home-card">
            <div className="public-home-kicker">Espaço da família</div>
            <h1 id="public-home-title">
              Toda família tem uma rotina.
              <br />
              Aqui ela encontra seu lugar.
            </h1>
            <p>Finanças, compras, tarefas e rotina da casa em um espaço familiar privado.</p>
            {error ? <div className="error-banner" role="alert">{error}</div> : null}
            <div className="public-home-actions">
              <button className="public-home-btn primary" type="button" onClick={() => startGoogle(nextPath)} disabled={loading}>
                {loading ? 'Abrindo...' : 'Entrar'}
              </button>
              <button className="public-home-btn ghost" type="button" onClick={() => startGoogle('/familia/criar')} disabled={loading}>
                Criar minha família
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
