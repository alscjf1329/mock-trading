import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import PwaRegister from '@/components/PwaRegister'
import BottomNav from '@/components/BottomNav'

const noto = Noto_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '모의투자',
    template: '%s | 모의투자',
  },
  description: '시드 1,000만원으로 국내주·미국주를 실제 시세로 매매하고 수익금 랭킹을 겨루는 모의투자 앱',
  keywords: ['모의투자', '주식 모의투자', '국내주', '미국주', '주식 연습', '랭킹'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '모의투자',
  },
  openGraph: {
    title: '모의투자',
    description: '시드 1,000만원으로 국내주·미국주 실제 시세 매매 — 수익금 랭킹 도전',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '모의투자',
    description: '시드 1,000만원으로 국내주·미국주 실제 시세 매매 — 수익금 랭킹 도전',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111827',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${noto.className} bg-gray-50 min-h-screen text-gray-900 antialiased pb-nav-safe sm:pb-0`}>
        <PwaRegister />
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
