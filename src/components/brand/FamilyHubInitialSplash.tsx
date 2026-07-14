'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import FamilyHubLogo from './FamilyHubLogo'

export default function FamilyHubInitialSplash() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const skipSplash = pathname?.startsWith('/logo')

  useEffect(() => {
    if (skipSplash) return

    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 2300)
    return () => window.clearTimeout(timer)
  }, [skipSplash])

  if (!visible || skipSplash) return null

  return (
    <div className="fh-app-splash" role="status" aria-label="Carregando Family Hub">
      <FamilyHubLogo
        animated
        animationStyle="bloom"
        markVariant="reference"
        className="fh-app-splash-logo"
        title="Family Hub"
      />
      <div className="fh-app-splash-progress" aria-hidden>
        <span />
      </div>
    </div>
  )
}
