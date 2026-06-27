'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Instalacao PWA nao deve afetar login ou uso principal.
    })
  }, [])

  return null
}
