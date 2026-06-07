import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '모의투자',
  description: '국내주 모의투자 — Yahoo Finance 실시간 시세 연동',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
