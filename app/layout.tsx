import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '모의투자 랭킹',
    template: '%s | 모의투자',
  },
  description: '시드 1,000만원으로 국내주·미국주를 실제 시세로 매매하고 수익금 랭킹을 겨루는 모의투자 앱',
  keywords: ['모의투자', '주식 모의투자', '국내주', '미국주', '주식 연습', '랭킹'],
  openGraph: {
    title: '모의투자 랭킹',
    description: '시드 1,000만원으로 국내주·미국주 실제 시세 매매 — 수익금 랭킹 도전',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '모의투자 랭킹',
    description: '시드 1,000만원으로 국내주·미국주 실제 시세 매매 — 수익금 랭킹 도전',
  },
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
