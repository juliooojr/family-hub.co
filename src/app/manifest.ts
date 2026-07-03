import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Family Hub',
    short_name: 'Family Hub',
    description: 'Hub familiar privado para compras, financas e rotina da familia.',
    lang: 'pt-BR',
    id: '/',
    scope: '/',
    start_url: '/hub',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#10110f',
    theme_color: '#10110f',
    categories: ['productivity', 'finance', 'lifestyle'],
    icons: [
      {
        src: '/icons/family-hub-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/family-hub-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/family-hub-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
