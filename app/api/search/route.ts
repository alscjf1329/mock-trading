import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&lang=ko-KR`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 },
    })
    const data = await res.json()
    const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? []
    const items = quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map(q => ({
        symbol: q.symbol as string,
        label: (q.shortname || q.longname || q.symbol) as string,
        exchange: q.exchDisp as string,
      }))
    return NextResponse.json(items)
  } catch {
    return NextResponse.json([])
  }
}
