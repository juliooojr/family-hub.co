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
  const showTimer = useRef<number | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    function scheduleShow() {
      if (showTimer.current !== null) return
      showTimer.current = window.setTimeout(() => {
        showTimer.current = null
        if (activeIds.current.size > 0) setVisible(true)
      }, 180)
    }

    function start(event: Event) {
      activeIds.current.add((event as LoadingEvent).detail?.id ?? 'manual')
      scheduleShow()
    }

    function end(event: Event) {
      activeIds.current.delete((event as LoadingEvent).detail?.id ?? 'manual')
      if (activeIds.current.size === 0) {
        if (showTimer.current !== null) window.clearTimeout(showTimer.current)
        showTimer.current = null
        setVisible(false)
      }
    }

    function followLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest('a') : null
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return

      const nextUrl = new URL(target.href, window.location.href)
      if (nextUrl.origin !== window.location.origin) return
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return

      activeIds.current.add('navigation')
      scheduleShow()
      if (nextUrl.pathname === window.location.pathname) {
        window.setTimeout(() => {
          activeIds.current.delete('navigation')
          setVisible(activeIds.current.size > 0)
        }, 180)
      }
    }

    function restorePage(event: PageTransitionEvent) {
      if (!event.persisted) return
      activeIds.current.delete('initial')
      activeIds.current.delete('navigation')
      if (showTimer.current !== null) window.clearTimeout(showTimer.current)
      showTimer.current = null
      setVisible(activeIds.current.size > 0)
    }

    window.addEventListener(LOADING_START, start)
    window.addEventListener(LOADING_END, end)
    window.addEventListener('pageshow', restorePage)
    document.addEventListener('click', followLink, true)
    return () => {
      window.removeEventListener(LOADING_START, start)
      window.removeEventListener(LOADING_END, end)
      window.removeEventListener('pageshow', restorePage)
      document.removeEventListener('click', followLink, true)
      if (showTimer.current !== null) window.clearTimeout(showTimer.current)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      activeIds.current.delete('initial')
      setVisible(activeIds.current.size > 0)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      activeIds.current.delete('navigation')
      setVisible(activeIds.current.size > 0)
    }, 80)
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
