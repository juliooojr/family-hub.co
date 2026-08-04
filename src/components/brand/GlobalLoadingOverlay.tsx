'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import FamilyHubLoadingMark from './FamilyHubLoadingMark'

const LOADING_START = 'fh-loading-start'
const LOADING_END = 'fh-loading-end'

type LoadingEvent = CustomEvent<{ id?: string }>

export default function GlobalLoadingOverlay() {
  const pathname = usePathname()
  const activeIds = useRef(new Set<string>(['initial']))
  const initialLoad = useRef(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    function start(event: Event) {
      activeIds.current.add((event as LoadingEvent).detail?.id ?? 'manual')
      setVisible(true)
    }

    function end(event: Event) {
      activeIds.current.delete((event as LoadingEvent).detail?.id ?? 'manual')
      setVisible(activeIds.current.size > 0)
    }

    function followLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest('a') : null
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return

      const nextUrl = new URL(target.href, window.location.href)
      if (nextUrl.origin !== window.location.origin) return
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return

      activeIds.current.add('navigation')
      setVisible(true)
      if (nextUrl.pathname === window.location.pathname) {
        window.setTimeout(() => {
          activeIds.current.delete('navigation')
          setVisible(activeIds.current.size > 0)
        }, 180)
      }
    }

    window.addEventListener(LOADING_START, start)
    window.addEventListener(LOADING_END, end)
    document.addEventListener('click', followLink, true)
    return () => {
      window.removeEventListener(LOADING_START, start)
      window.removeEventListener(LOADING_END, end)
      document.removeEventListener('click', followLink, true)
    }
  }, [])

  useEffect(() => {
    const delay = initialLoad.current ? 900 : 80
    const timer = window.setTimeout(() => {
      activeIds.current.delete(initialLoad.current ? 'initial' : 'navigation')
      initialLoad.current = false
      setVisible(activeIds.current.size > 0)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="app-loading-overlay" aria-live="polite" aria-busy="true">
      <FamilyHubLoadingMark />
    </div>
  )
}

export function useGlobalLoading(active: boolean, name: string) {
  const reactId = useId()
  const id = `${name}-${reactId}`

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(active ? LOADING_START : LOADING_END, { detail: { id } }))
    return () => {
      if (active) window.dispatchEvent(new CustomEvent(LOADING_END, { detail: { id } }))
    }
  }, [active, id])
}
