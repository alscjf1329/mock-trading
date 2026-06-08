import { NextRequest, NextResponse } from 'next/server'
import { STOCKS } from '@/lib/stocks'

function getLocalStock(symbol: string) {
  return STOCKS.find(s => s.symbol === symbol) ?? null
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  const from = req.nextUrl.searchParams.get('from') // YYYY-MM-DD
  const to = req.nextUrl.searchParams.get('to')     // YYYY-MM-DD
  if (!symbol || !from || !to) {
    return NextResponse.json({ error: 'symbol, from, to 필요' }, { status: 400 })
  }

  // DATE 컬럼이 T00:00:00.000Z 붙어서 올 수 있으므로 앞 10자만 사용
  const fromDate = from.slice(0, 10)
  const toDate = to.slice(0, 10)
  const period1 = Math.floor(new Date(fromDate).getTime() / 1000)
  const period2 = Math.floor(new Date(toDate).getTime() / 1000) + 86400

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await res.json()
    const result = data.chart?.result?.[0]
    if (!result) throw new Error('데이터 없음')

    const meta = result.meta
    const local = getLocalStock(symbol)
    const timestamps: string[] = (result.timestamp ?? []).map((t: number) =>
      new Date(t * 1000).toISOString().slice(0, 10)
    )
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []

    // 시작일 종가 = 매수 기준가, 종료일 종가 = 현재가
    const startPrice = closes[0]
    const endPrice = closes[closes.length - 1]

    return NextResponse.json({
      symbol,
      name:   local?.name   ?? meta.longName ?? meta.shortName ?? symbol,
      nameKo: local?.nameKo ?? null,
      currency: meta.currency,
      startPrice,
      endPrice,
      chart: { timestamps, closes },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 500 })
  }
}
