'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'

type ActiveModule = 'home' | 'tasks' | 'finance' | 'shopping'
type NavigationItem = {
  id: string
  label: string
  icon: string
  href?: string
  locked?: boolean
}

const navigation: NavigationItem[] = [
  { id: 'home', label: 'Início', icon: '🏠', href: '/hub' },
  { id: 'finance', label: 'Finanças', icon: '💰', href: '/financeiro' },
  { id: 'shopping', label: 'Compras', icon: '🛒', href: '/compras' },
  { id: 'tasks', label: 'Tarefas', icon: '📋', href: '/tarefas' },
  { id: 'calendar', label: 'Agenda', icon: '📅', locked: true },
  { id: 'documents', label: 'Documentos', icon: '📁', locked: true },
  { id: 'emergency', label: 'Emergência', icon: '🚨', locked: true },
]

export default function InternalShell({
  active,
  children,
}: {
  active: ActiveModule
  children: ReactNode
}) {
  const theme = usePreference('fh-theme', 'light')
  const sidebar = usePreference('fh-sidebar', 'expanded')
  const pathname = usePathname()
  const router = useRouter()
  const collapsed = sidebar === 'collapsed'

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.href && item.href !== pathname) router.prefetch(item.href)
    })
  }, [pathname, router])

  function toggleTheme() {
    setPreference('fh-theme', theme === 'light' ? 'dark' : 'light')
  }

  function toggleSidebar() {
    setPreference('fh-sidebar', collapsed ? 'expanded' : 'collapsed')
  }

  return (
    <div className={`internal-app ${theme === 'light' ? 'light' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="internal-mobile-bar">
        <div className="internal-logo">FAMILY<span>.</span>HUB</div>
        <button className="internal-icon-button" type="button" onClick={toggleTheme} aria-label="Alternar tema">
          ☀︎ / ☾
        </button>
      </header>

      <div className="internal-shell">
        <aside className="internal-sidebar">
          <div className="internal-side-head">
            <div className="internal-logo internal-logo-full">FAMILY<span>.</span>HUB</div>
            <div className="internal-logo internal-logo-short">F<span>.</span>H</div>
          </div>

          <button className="internal-menu-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
            <span>☰</span><strong>{collapsed ? 'Expandir' : 'Recolher menu'}</strong>
          </button>

          <nav className="internal-nav" aria-label="Módulos">
            {navigation.map((item) => item.locked ? (
              <span className="internal-nav-item locked" data-tooltip={`${item.label} · em breve`} title={`${item.label} em breve`} key={item.id}>
                <i>{item.icon}</i><strong>{item.label}</strong><small>🔒</small>
              </span>
            ) : (
              <Link className={`internal-nav-item ${active === item.id ? 'active' : ''}`} href={item.href!} prefetch data-tooltip={item.label} title={item.label} key={item.id}>
                <i>{item.icon}</i><strong>{item.label}</strong><NavPendingHint />
              </Link>
            ))}
          </nav>

          <div className="internal-side-bottom">
            <button className="internal-side-action" type="button" onClick={toggleTheme}>
              <span>☀︎ / ☾</span><strong>Alternar tema</strong>
            </button>
            <a className="internal-side-action" href="/auth/logout">
              <span>↩</span><strong>Sair</strong>
            </a>
          </div>
        </aside>

        <div className="internal-content">{children}</div>
      </div>

      <nav className="internal-mobile-nav" aria-label="Navegação principal">
        <Link className={active === 'home' ? 'active' : ''} href="/hub" prefetch aria-label="Início">🏠<NavPendingHint /></Link>
        <Link className={active === 'finance' ? 'active' : ''} href="/financeiro" prefetch aria-label="Finanças">💰<NavPendingHint /></Link>
        <Link className={active === 'shopping' ? 'active' : ''} href="/compras" prefetch aria-label="Compras">🛒<NavPendingHint /></Link>
        <Link className={active === 'tasks' ? 'active' : ''} href="/tarefas" prefetch aria-label="Tarefas">📋<NavPendingHint /></Link>
        <a href="/auth/logout" aria-label="Sair">↩</a>
      </nav>
    </div>
  )
}

function NavPendingHint() {
  const { pending } = useLinkStatus()
  return <span className={`nav-pending-hint ${pending ? 'is-pending' : ''}`} aria-hidden />
}

function usePreference(key: string, fallback: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange)
      window.addEventListener('fh-preferences', onStoreChange)
      return () => {
        window.removeEventListener('storage', onStoreChange)
        window.removeEventListener('fh-preferences', onStoreChange)
      }
    },
    () => window.localStorage.getItem(key) ?? fallback,
    () => fallback,
  )
}

function setPreference(key: string, value: string) {
  window.localStorage.setItem(key, value)
  window.dispatchEvent(new Event('fh-preferences'))
}
