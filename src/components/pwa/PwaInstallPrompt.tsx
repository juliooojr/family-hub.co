'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (window.localStorage.getItem('fh-pwa-install-dismissed') === 'true') return

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setVisible(false)
      setInstallEvent(null)
    }
  }

  function dismiss() {
    window.localStorage.setItem('fh-pwa-install-dismissed', 'true')
    setVisible(false)
  }

  if (!visible || !installEvent) return null

  return (
    <aside className="pwa-install" aria-label="Instalar aplicativo">
      <div>
        <strong>Family Hub no celular</strong>
        <span>Abra como aplicativo, direto pela tela inicial.</span>
      </div>
      <button type="button" onClick={install}>Instalar</button>
      <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Fechar">x</button>
    </aside>
  )
}
