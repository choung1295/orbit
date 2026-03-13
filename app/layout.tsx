import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0f0f11',
}

export const metadata: Metadata = {
  title: 'Orbit — AI Chat Platform',
  description: 'orbitai.co.kr',
  applicationName: 'Orbit AI',
  appleWebApp: {
    capable: true,
    title: 'Orbit AI',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png' },
    ],
  },
  openGraph: {
    title: 'Orbit — AI Chat Platform',
    description: 'orbitai.co.kr',
    url: 'https://orbitai.co.kr',
    siteName: 'Orbit AI',
    images: [
      {
        url: 'https://orbitai.co.kr/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Orbit AI — Your Strategic AI Companion',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbit — AI Chat Platform',
    description: 'orbitai.co.kr',
    images: ['https://orbitai.co.kr/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}