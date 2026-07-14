'use client'

type PushSubscriptionPayload = {
  endpoint: string
  expirationTime: number | null
  keys: { p256dh: string; auth: string }
}

export function canUsePushNotifications() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export async function subscribeCurrentDevice() {
  if (!canUsePushNotifications()) throw new Error('Este navegador não oferece notificações push.')
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) throw new Error('As notificações ainda não foram configuradas no servidor.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permita as notificações do Family Hub nos ajustes do celular.')

  let registration: ServiceWorkerRegistration
  try {
    registration = await navigator.serviceWorker.register('/sw.js')
    await waitForActiveServiceWorker(registration)
  } catch {
    throw new Error('Não foi possível preparar as notificações neste navegador. Atualize a página e tente novamente.')
  }
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  const payload = subscription.toJSON() as PushSubscriptionPayload
  const response = await fetch('/api/push/subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(result?.error || 'Não foi possível ativar as notificações neste aparelho.')
  }
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

async function waitForActiveServiceWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) return
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Service worker indisponível.')), 8000)
    }),
  ])
}
