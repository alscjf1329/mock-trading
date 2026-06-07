import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const [quote, chart] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.chart(symbol, { interval: '1d', range: '3mo' }),
    ])

    const closes = chart.quotes.map((q) => q.close ?? null)
    const timestamps = chart.quotes.map((q) => q.date.toISOString().slice(0, 10))

    return NextResponse.json({
      symbol,
      name: quote.shortName || quote.longName || symbol,
      price: quote.regularMarketPrice,
      previousClose: quote.regularMarketPreviousClose,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      currency: quote.currency,
      chart: { timestamps, closes },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 500 })
  }
}
