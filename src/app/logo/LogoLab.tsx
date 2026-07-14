import Link from 'next/link'
import FamilyHubLogo from '@/components/brand/FamilyHubLogo'
import FamilyHubSplash from '@/components/brand/FamilyHubSplash'
import './logo.css'

type ThemeMode = 'light' | 'dark'
type AnimationMode = 'full' | 'house'

export default function LogoLab({
  theme,
  animation,
  replayKey,
}: {
  theme: ThemeMode
  animation: AnimationMode
  replayKey: number
}) {
  const nextReplayKey = replayKey + 1

  return (
    <main className={`logo-lab ${theme}`}>
      <header className="logo-lab-header">
        <div>
          <span>Family Hub</span>
          <h1>Teste da nova logo</h1>
        </div>
        <div className="logo-lab-actions" aria-label="Controles da logo">
          <div className="logo-segmented" role="group" aria-label="Tema">
            <Link className={theme === 'light' ? 'active' : ''} href={logoHref('light', animation, nextReplayKey)}>Claro</Link>
            <Link className={theme === 'dark' ? 'active' : ''} href={logoHref('dark', animation, nextReplayKey)}>Escuro</Link>
          </div>
          <div className="logo-segmented" role="group" aria-label="Animacao">
            <Link className={animation === 'full' ? 'active' : ''} href={logoHref(theme, 'full', nextReplayKey)}>Completa</Link>
            <Link className={animation === 'house' ? 'active' : ''} href={logoHref(theme, 'house', nextReplayKey)}>Casa</Link>
          </div>
          <Link className="logo-replay" href={logoHref(theme, animation, nextReplayKey)}>Reproduzir</Link>
        </div>
      </header>

      <section className="logo-stage" aria-label="Splash screen animada">
        <FamilyHubSplash variant={animation} replayKey={replayKey} />
      </section>

      <section className="logo-grid" aria-label="Variacoes da marca">
        <article>
          <span>Logo estatica</span>
          <FamilyHubLogo className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Principal referencia</span>
          <FamilyHubLogo animated animationStyle="bloom" markVariant="reference" className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Casa carregando</span>
          <FamilyHubLogo animated houseOnly className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Opcao 2 suave</span>
          <FamilyHubLogo animated animationStyle="soft" className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Opcao construcao</span>
          <FamilyHubLogo animated className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Opcao 4 ponto guia</span>
          <FamilyHubLogo animated animationStyle="anchor" className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>H como parede</span>
          <FamilyHubLogo animated animationStyle="bloom" markVariant="sharedLeg" className="logo-static" />
        </article>
        <article className="logo-option-card">
          <span>Referencia anexo</span>
          <FamilyHubLogo animated animationStyle="bloom" markVariant="reference" className="logo-static" />
        </article>
      </section>
    </main>
  )
}

function logoHref(theme: ThemeMode, animation: AnimationMode, replayKey: number) {
  return `/logo?tema=${theme}&animacao=${animation}&r=${replayKey}`
}
