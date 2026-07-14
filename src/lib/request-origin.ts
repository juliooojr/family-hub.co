import type { NextRequest } from 'next/server'

export function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host')
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const fallbackProtocol = request.nextUrl.protocol.replace(':', '')
  const protocol = forwardedProtocol === 'http' || forwardedProtocol === 'https'
    ? forwardedProtocol
    : fallbackProtocol

  if (host && (protocol === 'http' || protocol === 'https')) {
    try {
      return new URL(`${protocol}://${host}`).origin
    } catch {
      // Usa a URL normalizada pelo Next quando os headers estiverem invalidos.
    }
  }

  return request.nextUrl.origin
}
