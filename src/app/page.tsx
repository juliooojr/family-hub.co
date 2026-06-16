import Link from 'next/link'
import HubUser from '@/components/auth/HubUser'

const modules = [
  { name: 'INÍCIO', icon: '📊', className: 'bub-inicio', locked: true },
  { name: 'FINANÇAS', icon: '💰', className: 'bub-financeiro', href: '/financeiro' },
  { name: 'AGENDA', icon: '📅', className: 'bub-calendario', locked: true },
  { name: 'COMPRAS', icon: '🛒', className: 'bub-compras', href: '/compras' },
  { name: 'FLORA', icon: '🐾', className: 'bub-pets', locked: true },
  { name: 'DOCS', icon: '📁', className: 'bub-documentos', locked: true },
  { name: 'SOS', icon: '🚨', className: 'bub-emergencia', locked: true },
]

export default function Home() {
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  return (
    <main className="hub-screen">
      <header className="hub-header">
        <div className="hub-logo">FAMILY<span>.</span>HUB</div>
        <div className="hub-date">{date}</div>
        <HubUser />
      </header>
      <section className="orbital-wrap" aria-label="Módulos do Family Hub">
        <div className="orbit-ring ring1" /><div className="orbit-ring ring2" /><div className="orbit-ring ring3" />
        <div className="hub-center"><div className="hub-center-icon">🏠</div><div className="hub-center-label">HUB</div><div className="hub-center-copy">Escolha um módulo</div></div>
        {modules.map((module) => module.href ? (
          <Link href={module.href} prefetch className={`mod-bubble ${module.className}`} key={module.name}>
            <div className="bubble-glow" /><div className="bubble-inner"><div className="bubble-dot" /><div className="bubble-icon">{module.icon}</div><div className="bubble-label">{module.name}</div></div>
          </Link>
        ) : (
          <div className={`mod-bubble ${module.className} locked`} data-locked key={module.name}>
            {module.className === 'bub-emergencia' ? <div className="sos-pulse" /> : null}
            <div className="bubble-inner"><div className="bubble-icon">{module.icon}</div><div className="bubble-label">{module.name}</div><div className="lock-icon">🔒</div></div>
          </div>
        ))}
      </section>
    </main>
  )
}
