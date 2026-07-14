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
import FamilyHubInitialSplash from '@/components/brand/FamilyHubInitialSplash'
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
  icons: {
    icon: [
      { url: '/icons/family-hub-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/family-hub-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'Family Hub',
    startupImage: [
      { url: '/splash/iphone-430x932.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/iphone-428x926.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/iphone-393x852.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/iphone-375x812.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/splash/iphone-414x896.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/splash/iphone-375x667.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/splash/iphone-320x568.png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)' },
    ],
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
        <FamilyHubInitialSplash />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  )
}
