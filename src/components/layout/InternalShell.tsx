'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { CalendarDays, ClipboardList, FileText, House, Lock, LogOut, Menu, Moon, ShoppingCart, Sun, TriangleAlert, Users, Wallet, type LucideIcon } from 'lucide-react'

type ActiveModule = 'home' | 'tasks' | 'finance' | 'shopping' | 'family'
type NavigationItem = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  locked?: boolean
}

const navigation: NavigationItem[] = [
  { id: 'home', label: 'Início', icon: House, href: '/hub' },
  { id: 'finance', label: 'Finanças', icon: Wallet, href: '/financeiro' },
  { id: 'shopping', label: 'Compras', icon: ShoppingCart, href: '/compras' },
  { id: 'tasks', label: 'Tarefas', icon: ClipboardList, href: '/tarefas' },
  { id: 'calendar', label: 'Agenda', icon: CalendarDays, locked: true },
  { id: 'documents', label: 'Documentos', icon: FileText, locked: true },
  { id: 'emergency', label: 'Emergência', icon: TriangleAlert, locked: true },
]

export default function InternalShell({
  active,
  canManageFamily = false,
  children,
}: {
  active: ActiveModule
  canManageFamily?: boolean
  children: ReactNode
}) {
  const theme = usePreference('fh-theme', 'light')
  const sidebar = usePreference('fh-sidebar', 'expanded')
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false)
  const collapsed = sidebar === 'collapsed'

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.href && item.href !== pathname) router.prefetch(item.href)
    })
    if (canManageFamily && pathname !== '/familia') router.prefetch('/familia')
  }, [canManageFamily, pathname, router])

  function toggleTheme() {
    setPreference('fh-theme', theme === 'light' ? 'dark' : 'light')
  }

  function toggleSidebar() {
    setPreference('fh-sidebar', collapsed ? 'expanded' : 'collapsed')
  }

  return (
    <div className={`internal-app ${theme === 'light' ? 'light' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="internal-mobile-bar">
        <div className="internal-logo">FAMILY<span>.</span>HUB{process.env.NODE_ENV === 'development' ? <small className="environment-badge">LOCAL</small> : null}</div>
        <button className="internal-icon-button" type="button" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </button>
      </header>

      <div className="internal-shell">
        <aside className="internal-sidebar">
          <div className="internal-side-head">
            <div className="internal-logo internal-logo-full">FAMILY<span>.</span>HUB{process.env.NODE_ENV === 'development' ? <small className="environment-badge">LOCAL</small> : null}</div>
            <div className="internal-logo internal-logo-short">F<span>.</span>H</div>
          </div>

          <button className="internal-menu-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
            <span><Menu aria-hidden /></span><strong>{collapsed ? 'Expandir' : 'Recolher menu'}</strong>
          </button>

          <nav className="internal-nav" aria-label="Módulos">
            {navigation.map((item) => {
              const Icon = item.icon
              return item.locked ? (
              <span className="internal-nav-item locked" data-tooltip={`${item.label} · em breve`} title={`${item.label} em breve`} key={item.id}>
                <i><Icon aria-hidden /></i><strong>{item.label}</strong><small><Lock aria-hidden /></small>
              </span>
            ) : (
              <Link className={`internal-nav-item ${active === item.id ? 'active' : ''}`} href={item.href!} prefetch data-tooltip={item.label} title={item.label} key={item.id}>
                <i><Icon aria-hidden /></i><strong>{item.label}</strong>
              </Link>
            )})}
          </nav>

          <div className="internal-side-bottom">
            <button className="internal-side-action" type="button" onClick={toggleTheme}>
              <span>{theme === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}</span><strong>Alternar tema</strong>
            </button>
            {canManageFamily ? (
              <Link className={`internal-side-action ${active === 'family' ? 'active' : ''}`} href="/familia" prefetch>
                <span><Users aria-hidden /></span><strong>Gerenciar</strong>
              </Link>
            ) : null}
            <button className="internal-side-action" type="button" onClick={() => setLogoutConfirmationOpen(true)}>
              <span><LogOut aria-hidden /></span><strong>Sair</strong>
            </button>
          </div>
        </aside>

        <div className="internal-content">{children}</div>
      </div>

      {mobileMenuOpen ? <div className="internal-mobile-menu" role="dialog" aria-label="Menu rápido">
        <button type="button" onClick={() => { toggleTheme(); setMobileMenuOpen(false) }}>{theme === 'light' ? <Moon aria-hidden /> : <Sun aria-hidden />}<span>Alternar tema</span></button>
        {canManageFamily ? <Link href="/familia" prefetch onClick={() => setMobileMenuOpen(false)}><Users aria-hidden /><span>Gerenciar família</span></Link> : null}
        <button type="button" onClick={() => { setMobileMenuOpen(false); setLogoutConfirmationOpen(true) }}><LogOut aria-hidden /><span>Sair</span></button>
      </div> : null}
      <nav className="internal-mobile-nav" aria-label="Navegação principal">
        <Link className={active === 'home' ? 'active' : ''} href="/hub" prefetch aria-label="Início"><House aria-hidden /></Link>
        <Link className={active === 'finance' ? 'active' : ''} href="/financeiro" prefetch aria-label="Finanças"><Wallet aria-hidden /></Link>
        <Link className={active === 'shopping' ? 'active' : ''} href="/compras" prefetch aria-label="Compras"><ShoppingCart aria-hidden /></Link>
        <Link className={active === 'tasks' ? 'active' : ''} href="/tarefas" prefetch aria-label="Tarefas"><ClipboardList aria-hidden /></Link>
        <button className={mobileMenuOpen ? 'active' : ''} type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Abrir menu" aria-expanded={mobileMenuOpen}><Menu aria-hidden /></button>
      </nav>
      {logoutConfirmationOpen ? <LogoutConfirmation onClose={() => setLogoutConfirmationOpen(false)} /> : null}
    </div>
  )
}

function LogoutConfirmation({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card logout-confirmation" role="dialog" aria-modal="true" aria-label="Confirmar saída">
        <header><h2>SAIR DO FAMILY HUB</h2><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="confirm-copy"><p>Tem certeza que deseja sair?</p></div>
        <div className="modal-actions"><button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button><a className="button button-danger" href="/auth/logout">Sair</a></div>
      </section>
    </div>
  )
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
