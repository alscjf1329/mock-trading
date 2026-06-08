import { NextRequest, NextResponse } from 'next/server'
import { STOCKS } from '@/lib/stocks'

function getLocalStock(symbol: string) {
  return STOCKS.find(s => s.symbol === symbol) ?? null
}

export async function GET(req: NextRequest) {
  const symbol  = req.nextUrl.searchParams.get('symbol')
  const from    = req.nextUrl.searchParams.get('from')   // trade_start (YYYY-MM-DD)
  const to      = req.nextUrl.searchParams.get('to')     // 현재 매핑된 과거 날짜 (YYYY-MM-DD)
  if (!symbol || !from || !to) {
    return NextResponse.json({ error: 'symbol, from, to 필요' }, { status: 400 })
  }

  const fromDate = from.slice(0, 10)
  const toDate   = to.slice(0, 10)

  // toDate가 fromDate보다 이르면 아직 첫날도 안 됨
  if (toDate < fromDate) {
    return NextResponse.json({ error: '아직 챌린지가 시작되지 않았어요' }, { status: 400 })
  }

  const period1 = Math.floor(new Date(fromDate).getTime() / 1000)
  // +하루를 더해서 toDate 당일 종가까지 포함
  const period2 = Math.floor(new Date(toDate).getTime() / 1000) + 86400

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await res.json()
    const result = data.chart?.result?.[0]
    if (!result) throw new Error('데이터 없음')

    const meta   = result.meta
    const local  = getLocalStock(symbol)

    const rawTimestamps: number[] = result.timestamp ?? []
    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []

    // null 종가 제거
    const pairs = rawTimestamps
      .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: rawCloses[i] }))
      .filter(p => p.close != null) as { date: string; close: number }[]

    if (pairs.length === 0) throw new Error('이 기간에 시세 데이터가 없어요')

    const currentPrice = pairs[pairs.length - 1].close
    const prevClose    = pairs.length >= 2 ? pairs[pairs.length - 2].close : currentPrice
    const currentDate  = pairs[pairs.length - 1].date

    return NextResponse.json({
      symbol,
      name:         local?.name   ?? meta.longName ?? meta.shortName ?? symbol,
      nameKo:       local?.nameKo ?? null,
      currency:     meta.currency,
      currentPrice,
      prevClose,
      currentDate,
      change:        currentPrice - prevClose,
      changePercent: ((currentPrice - prevClose) / prevClose) * 100,
      chart: {
        timestamps: pairs.map(p => p.date),
        closes:     pairs.map(p => p.close),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 500 })
  }
}
