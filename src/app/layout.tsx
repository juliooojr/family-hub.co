import type { Metadata, Viewport } from 'next'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/900.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './globals.css'
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'

export const metadata: Metadata = {
  metadataBase: new URL('https://family-hub-co.vercel.app'),
  title: {
    default: 'Family Hub',
    template: '%s | Family Hub',
  },
  applicationName: 'Family Hub',
  description: 'Hub familiar privado para compras, financas e rotina da familia.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Family Hub',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    title: 'Family Hub',
    description: 'Hub familiar privado para compras, financas e rotina da familia.',
    url: '/',
    siteName: 'Family Hub',
    locale: 'pt_BR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e9' },
    { media: '(prefers-color-scheme: dark)', color: '#10110f' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ServiceWorkerRegister />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  )
}
