import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orbit — AI Chat Platform',
  description: 'The AI chat workspace built for deep work.',
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
