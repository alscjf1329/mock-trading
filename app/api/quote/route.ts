import { NextRequest, NextResponse } from 'next/server'

async function yahooFetch(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const [quoteRes, chartRes] = await Promise.all([
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`),
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`),
    ])

    const meta = quoteRes.chart?.result?.[0]?.meta
    if (!meta) throw new Error('종목을 찾을 수 없음')

    const chartResult = chartRes.chart?.result?.[0]
    const timestamps: string[] = (chartResult?.timestamp ?? []).map((t: number) =>
      new Date(t * 1000).toISOString().slice(0, 10)
    )
    const closes: (number | null)[] = chartResult?.indicators?.quote?.[0]?.close ?? []

    return NextResponse.json({
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose ?? meta.chartPreviousClose,
      change: meta.regularMarketPrice - (meta.previousClose ?? meta.chartPreviousClose),
      changePercent: ((meta.regularMarketPrice - (meta.previousClose ?? meta.chartPreviousClose)) / (meta.previousClose ?? meta.chartPreviousClose)) * 100,
      open: meta.regularMarketOpen ?? meta.regularMarketPrice,
      high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      currency: meta.currency,
      chart: { timestamps, closes },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 500 })
  }
}
