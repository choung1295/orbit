import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orbit — AI Chat Platform',
  description: 'orbitai.co.kr',
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