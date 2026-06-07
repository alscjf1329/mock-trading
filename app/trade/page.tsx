import type { Metadata } from 'next'
import TradeClient from './TradeClient'

export const metadata: Metadata = {
  title: '트레이딩',
  description: '닉네임으로 시작하는 모의투자 — 매수/매도 후 랭킹 등록',
}

export default function TradePage() {
  return <TradeClient />
}
